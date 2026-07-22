import { AsyncLocalStorage } from 'async_hooks';
import { TenantContext } from './types';

const StorageClass = (typeof AsyncLocalStorage === 'function')
  ? AsyncLocalStorage
  : class DummyLocalStorage<T> {
      private store: T | undefined;
      run<R>(store: T, callback: () => R): R {
        const prev = this.store;
        this.store = store;
        try {
          return callback();
        } finally {
          this.store = prev;
        }
      }
      getStore(): T | undefined {
        return this.store;
      }
    };

export class TenantContextStorage {
  private static storage = new StorageClass<TenantContext>();

  public static run<R>(context: TenantContext, callback: () => R): R {
    return this.storage.run(context, callback);
  }

  public static getContext(): TenantContext | undefined {
    return this.storage.getStore();
  }

  public static requireContext(): TenantContext {
    const context = this.getContext();
    if (!context) {
      throw new Error('TenantContext is required but not found in current execution scope.');
    }
    return context;
  }
}
