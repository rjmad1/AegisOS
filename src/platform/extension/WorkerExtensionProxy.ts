import { Worker } from "worker_threads";
import { IExtension, ExtensionContext } from "./ExtensionSDK";
import * as path from "path";

export class WorkerExtensionProxy implements IExtension {
  private worker: Worker;
  private workerSubMap: Map<string, string> = new Map();

  constructor(private scriptPath: string) {
    this.worker = new Worker(`
      const { parentPort } = require('worker_threads');
      const vm = require('vm');
      const fs = require('fs');

      let instance = null;

      // fake context to proxy back to main thread
      const rpcCall = (method, args) => {
        return new Promise((resolve, reject) => {
          const id = Date.now().toString() + Math.random().toString();
          const handler = (msg) => {
            if (msg.responseId === id) {
              parentPort.off('message', handler);
              if (msg.error) reject(new Error(msg.error));
              else resolve(msg.result);
            }
          };
          parentPort.on('message', handler);
          parentPort.postMessage({ type: 'rpc', id, method, args });
        });
      };

      const fakeContext = {
        logger: {
          info: (...args) => parentPort.postMessage({ type: 'rpc', method: 'logger.info', args }),
          warn: (...args) => parentPort.postMessage({ type: 'rpc', method: 'logger.warn', args }),
          error: (msg, err, ...args) => parentPort.postMessage({ type: 'rpc', method: 'logger.error', args: [msg, err?.message, ...args] })
        },
        eventBus: {
          publish: (name, payload) => rpcCall('eventBus.publish', [name, payload]),
          subscribe: (name, handler) => {
            const subId = Date.now().toString() + Math.random().toString();
            parentPort.on('message', (msg) => {
              if (msg.type === 'event' && msg.subId === subId) {
                handler(msg.event);
              }
            });
            rpcCall('eventBus.subscribe', [name, subId]);
            return subId;
          },
          unsubscribe: (subId) => rpcCall('eventBus.unsubscribe', [subId])
        }
      };

      parentPort.on('message', async (msg) => {
        if (msg.responseId || msg.type === 'event') return;
        try {
          if (msg.type === 'initialize') {
            const code = fs.readFileSync(msg.scriptPath, 'utf8');
            const sandbox = { 
              require: require,
              console: console,
              exports: {},
              module: { exports: {} },
              process: process,
              Buffer: Buffer,
              setTimeout: setTimeout,
              clearTimeout: clearTimeout,
              setInterval: setInterval,
              clearInterval: clearInterval
            };
            vm.createContext(sandbox);
            vm.runInContext(code, sandbox);
            
            const extClass = sandbox.module.exports.default || sandbox.module.exports;
            if (typeof extClass === 'function') {
              instance = new extClass();
            }
            
            Object.assign(fakeContext, {
              extensionId: msg.contextData.extensionId,
              manifest: msg.contextData.manifest,
              config: msg.contextData.config
            });
            
            if (instance && instance.initialize) {
              await instance.initialize(fakeContext);
            }
            parentPort.postMessage({ type: 'initialized' });
          } else if (msg.type === 'shutdown') {
            if (instance && instance.shutdown) {
              await instance.shutdown();
            }
            parentPort.postMessage({ type: 'shutdown_complete' });
          }
        } catch (e) {
          parentPort.postMessage({ type: 'error', error: e.stack || e.message });
        }
      });
    `, { eval: true });
  }

  async initialize(context: ExtensionContext): Promise<void> {
    return new Promise((resolve, reject) => {
      const messageHandler = async (msg: any) => {
        if (msg.type === 'initialized') {
          resolve();
        } else if (msg.type === 'error') {
          reject(new Error(msg.error));
        } else if (msg.type === 'rpc') {
          try {
            let result;
            if (msg.method === 'logger.info') {
              context.logger.info(msg.args[0], ...msg.args.slice(1));
            } else if (msg.method === 'logger.warn') {
              context.logger.warn(msg.args[0], ...msg.args.slice(1));
            } else if (msg.method === 'logger.error') {
              context.logger.error(msg.args[0], new Error(msg.args[1]), ...msg.args.slice(2));
            } else if (msg.method === 'eventBus.publish') {
              await context.eventBus.publish(msg.args[0], msg.args[1]);
            } else if (msg.method === 'eventBus.subscribe') {
               const workerSubId = msg.args[1];
               const realSubId = context.eventBus.subscribe(msg.args[0], (event) => {
                 this.worker.postMessage({ type: 'event', subId: workerSubId, event });
               });
               this.workerSubMap.set(workerSubId, realSubId);
               result = workerSubId;
            } else if (msg.method === 'eventBus.unsubscribe') {
               const workerSubId = msg.args[0];
               const realSubId = this.workerSubMap.get(workerSubId);
               if (realSubId) {
                 context.eventBus.unsubscribe(realSubId);
                 this.workerSubMap.delete(workerSubId);
               }
            }
            if (msg.id) {
              this.worker.postMessage({ responseId: msg.id, result });
            }
          } catch (e: any) {
            if (msg.id) {
              this.worker.postMessage({ responseId: msg.id, error: e.message });
            }
          }
        }
      };

      this.worker.on('message', messageHandler);
      this.worker.on('error', reject);
      this.worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });

      this.worker.postMessage({
        type: 'initialize',
        scriptPath: this.scriptPath,
        contextData: {
          extensionId: context.extensionId,
          manifest: context.manifest,
          config: context.config
        }
      });
    });
  }

  async shutdown(): Promise<void> {
    return new Promise((resolve, reject) => {
      const onMsg = (msg: any) => {
        if (msg.type === 'shutdown_complete') {
          this.worker.off('message', onMsg);
          this.worker.terminate().then(resolve as any);
        } else if (msg.type === 'error') {
          this.worker.off('message', onMsg);
          reject(new Error(msg.error));
        }
      };
      this.worker.on('message', onMsg);
      this.worker.postMessage({ type: 'shutdown' });
    });
  }
}
