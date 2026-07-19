// ============================================================================
// Background Synchronization Scheduler — Database & Runtime Sync
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { eventBus } from '../events/event-bus';
import { runtimeService } from '../../services/runtime.service';
import { providerFactory } from '../factories/provider-factory';
import { filesystemWatcherService } from '../watcher/watcher-service';

export interface SyncCheckpoint {
  lastSyncTime: number;
  knownConversations: Record<string, { messageCount: number; status: string }>;
  knownExecutions: Record<string, { status: string; progress: number }>;
  knownAgents: string[];
  knownWorkflows: string[];
  knownTools: string[];
  configMtime: number;
}

export class SyncScheduler {
  private static instance: SyncScheduler | null = null;
  private interval: any = null;
  private isRunning = false;
  private checkpointPath: string;
  private state: SyncCheckpoint;

  private constructor() {
    const dbDir = process.env.OPS_DATABASES_DIR || path.resolve(process.cwd(), 'databases');
    this.checkpointPath = path.resolve(dbDir, 'sync_checkpoint.json');
    this.state = this.loadCheckpoint();
  }

  public static getInstance(): SyncScheduler {
    if (!SyncScheduler.instance) {
      SyncScheduler.instance = new SyncScheduler();
    }
    return SyncScheduler.instance;
  }

  private loadCheckpoint(): SyncCheckpoint {
    try {
      if (fs.existsSync(this.checkpointPath)) {
        const raw = fs.readFileSync(this.checkpointPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('[SyncScheduler] Failed to load checkpoint. Creating new.', e);
    }

    return {
      lastSyncTime: 0,
      knownConversations: {},
      knownExecutions: {},
      knownAgents: [],
      knownWorkflows: [],
      knownTools: [],
      configMtime: 0,
    };
  }

  private saveCheckpoint() {
    try {
      const dir = path.dirname(this.checkpointPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.state.lastSyncTime = Date.now();
      fs.writeFileSync(this.checkpointPath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('[SyncScheduler] Failed to save checkpoint:', e);
    }
  }

  public start(intervalMs = 3000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[SyncScheduler] Background synchronization started (Interval: ${intervalMs}ms)`);

    this.interval = setInterval(() => {
      this.tick().catch((err) => {
        console.error('[SyncScheduler] Synchronization tick failed:', err);
      });
    }, intervalMs);
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('[SyncScheduler] Background synchronization stopped');
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.state.lastSyncTime,
      activeWatcherCount: filesystemWatcherService.getActiveWatchers().length,
      checkpointPath: this.checkpointPath,
    };
  }

  private async tick() {
    // 1. Sync Configuration File Change
    const configPath = process.env.AEGISOS_CONFIG_PATH || 'D:/AegisOS/Config/aegisos.json';
    try {
      if (fs.existsSync(configPath)) {
        const stat = fs.statSync(configPath);
        if (stat.mtimeMs > this.state.configMtime) {
          const oldTime = this.state.configMtime;
          this.state.configMtime = stat.mtimeMs;
          
          if (oldTime > 0) {
            eventBus.publish({
              name: 'ConfigurationChanged',
              source: 'sync-scheduler',
              version: 'v1',
              priority: 'medium',
              securityClassification: 'internal',
              retentionPolicy: 'archive',
              payload: { path: configPath, modifiedAt: stat.mtime.toISOString() },
            });
          }
        }
      }
    } catch {}

    // 2. Sync Provider & Runtime Health
    try {
      const runtime = await runtimeService.getRuntime();
      const status = runtime.status as any; // 'online' | 'degraded' | 'offline'

      // Check if status changed
      const oldHealth = (this.state as any).runtimeHealth;
      if (oldHealth && oldHealth !== status) {
        eventBus.publish({
          name: 'RuntimeHealthChanged',
          source: 'sync-scheduler',
          version: 'v1',
          priority: 'critical',
          securityClassification: 'public',
          retentionPolicy: 'archive',
          payload: { previous: oldHealth, current: status, health: runtime.health },
        });

        // Provider connect/disconnect events
        if (status === 'offline') {
          eventBus.publish({
            name: 'ProviderDisconnected',
            source: 'sync-scheduler',
            version: 'v1',
            priority: 'critical',
            securityClassification: 'public',
            retentionPolicy: 'archive',
            payload: { providerId: 'aegisos-runtime-provider', providerName: 'AegisOS Runtime Provider' },
          });
        } else if (oldHealth === 'offline' && status !== 'offline') {
          eventBus.publish({
            name: 'ProviderConnected',
            source: 'sync-scheduler',
            version: 'v1',
            priority: 'high',
            securityClassification: 'public',
            retentionPolicy: 'archive',
            payload: { providerId: 'aegisos-runtime-provider', providerName: 'AegisOS Runtime Provider' },
          });
        }
      }
      (this.state as any).runtimeHealth = status;
    } catch {}

    // 3. Sync Conversations
    try {
      const convData = await runtimeService.getConversations({ limit: 100 });
      for (const conv of convData.conversations) {
        const known = this.state.knownConversations[conv.id];

        if (!known) {
          this.state.knownConversations[conv.id] = { messageCount: conv.messageCount, status: conv.status };
          eventBus.publish({
            name: 'ConversationStarted',
            source: 'sync-scheduler',
            version: 'v1',
            priority: 'medium',
            securityClassification: 'internal',
            retentionPolicy: 'archive',
            payload: { conversationId: conv.id, conversation: conv },
          });
        } else if (known.messageCount !== conv.messageCount || known.status !== conv.status) {
          this.state.knownConversations[conv.id] = { messageCount: conv.messageCount, status: conv.status };
          eventBus.publish({
            name: 'ConversationUpdated',
            source: 'sync-scheduler',
            version: 'v1',
            priority: 'medium',
            securityClassification: 'internal',
            retentionPolicy: 'archive',
            payload: { conversationId: conv.id, conversation: conv },
          });

          if (conv.status === 'completed' && known.status !== 'completed') {
            eventBus.publish({
              name: 'ConversationCompleted',
              source: 'sync-scheduler',
              version: 'v1',
              priority: 'medium',
              securityClassification: 'internal',
              retentionPolicy: 'archive',
              payload: { conversationId: conv.id },
            });
          }
        }
      }
    } catch {}

    // 4. Sync Executions
    try {
      const execData = await runtimeService.getExecutions({ limit: 100 });
      for (const exec of execData.executions) {
        const known = this.state.knownExecutions[exec.id];
        // Calculate progress percentage
        const progress = exec.status === 'succeeded' ? 100 : exec.status === 'failed' ? 100 : 50;

        if (!known) {
          this.state.knownExecutions[exec.id] = { status: exec.status, progress };
          eventBus.publish({
            name: 'ExecutionStarted',
            source: 'sync-scheduler',
            version: 'v1',
            priority: 'high',
            securityClassification: 'internal',
            retentionPolicy: 'session',
            payload: { executionId: exec.id, execution: exec },
          });
        } else {
          if (known.status !== exec.status || known.progress !== progress) {
            this.state.knownExecutions[exec.id] = { status: exec.status, progress };

            // Send execution progress event
            eventBus.publish({
              name: 'ExecutionProgress',
              source: 'sync-scheduler',
              version: 'v1',
              priority: 'medium',
              securityClassification: 'internal',
              retentionPolicy: 'session',
              payload: { executionId: exec.id, status: exec.status, progressPercentage: progress },
            });

            if (exec.status === 'succeeded') {
              eventBus.publish({
                name: 'ExecutionCompleted',
                source: 'sync-scheduler',
                version: 'v1',
                priority: 'high',
                securityClassification: 'internal',
                retentionPolicy: 'archive',
                payload: { executionId: exec.id, execution: exec },
              });
            } else if (exec.status === 'failed') {
              eventBus.publish({
                name: 'ExecutionFailed',
                source: 'sync-scheduler',
                version: 'v1',
                priority: 'critical',
                securityClassification: 'internal',
                retentionPolicy: 'archive',
                payload: { executionId: exec.id, error: exec.error || 'Execution failed' },
              });
            }
          }
        }
      }
    } catch {}

    // 5. Sync Agents, Workflows, Tools
    try {
      const agents = await runtimeService.getAgents();
      for (const agent of agents) {
        if (!this.state.knownAgents.includes(agent.id)) {
          this.state.knownAgents.push(agent.id);
          eventBus.publish({
            name: 'AgentRegistered',
            source: 'sync-scheduler',
            version: 'v1',
            priority: 'medium',
            securityClassification: 'internal',
            retentionPolicy: 'archive',
            payload: { agentId: agent.id, agent },
          });
        }
      }

      const workflows = await runtimeService.getWorkflows();
      for (const wf of workflows.workflows) {
        if (!this.state.knownWorkflows.includes(wf.id)) {
          this.state.knownWorkflows.push(wf.id);
          eventBus.publish({
            name: 'WorkflowDiscovered',
            source: 'sync-scheduler',
            version: 'v1',
            priority: 'medium',
            securityClassification: 'internal',
            retentionPolicy: 'archive',
            payload: { workflowId: wf.id, workflow: wf },
          });
        }
      }

      const tools = await runtimeService.getTools();
      for (const tool of tools) {
        if (!this.state.knownTools.includes(tool.name)) {
          this.state.knownTools.push(tool.name);
          eventBus.publish({
            name: 'ToolRegistered',
            source: 'sync-scheduler',
            version: 'v1',
            priority: 'low',
            securityClassification: 'internal',
            retentionPolicy: 'archive',
            payload: { name: tool.name, tool },
          });
        }
      }
    } catch {}

    this.saveCheckpoint();
  }
}

export const syncScheduler = SyncScheduler.getInstance();
// Start background scheduler on module import
if (process.env.NODE_ENV !== 'test') {
  syncScheduler.start();
}
