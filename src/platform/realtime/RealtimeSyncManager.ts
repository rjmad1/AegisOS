// ============================================================================
// Real-time Synchronization Manager — Client-side Event Coordinator
// ============================================================================

import { RealtimeTransport, ConnectionStatus, RealtimeEvent, TransportType } from './types';
import { createTransport } from './RealtimeTransport';
import { EventBus } from '../event-bus/EventBus';

export class RealtimeSyncManager {
  private static instance: RealtimeSyncManager | null = null;
  private transport: RealtimeTransport | null = null;
  private activeType: TransportType = 'sse';
  private checkpointKey = 'aegisos_sync_checkpoint';
  private lastCheckpoint: number = 0;
  
  // Backoff options
  private reconnectTimeout: any = null;
  private baseBackoffMs = 1000;
  private maxBackoffMs = 30000;
  private currentBackoffMs = 1000;
  private isExplicitDisconnect = false;

  // Heartbeat tracking
  private heartbeatInterval: any = null;
  private lastHeartbeatAt = 0;
  private heartbeatTimeoutMs = 15000; // Expected heartbeat every 15s

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadCheckpoint();
      
      // Browser offline/online triggers
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  public static getInstance(): RealtimeSyncManager {
    if (!RealtimeSyncManager.instance) {
      RealtimeSyncManager.instance = new RealtimeSyncManager();
    }
    return RealtimeSyncManager.instance;
  }

  private loadCheckpoint() {
    try {
      const stored = localStorage.getItem(this.checkpointKey);
      if (stored) {
        this.lastCheckpoint = parseInt(stored, 10);
      } else {
        this.lastCheckpoint = Date.now();
        this.saveCheckpoint(this.lastCheckpoint);
      }
    } catch {
      this.lastCheckpoint = Date.now();
    }
  }

  private saveCheckpoint(timestamp: number) {
    this.lastCheckpoint = timestamp;
    try {
      localStorage.setItem(this.checkpointKey, timestamp.toString());
    } catch {}
  }

  public getCheckpoint(): number {
    return this.lastCheckpoint;
  }

  public setTransportType(type: TransportType) {
    if (this.activeType !== type) {
      this.activeType = type;
      if (this.transport) {
        this.reconnect();
      }
    }
  }

  public getTransportType(): TransportType {
    return this.activeType;
  }

  public getStatus(): ConnectionStatus {
    return this.transport ? this.transport.status : 'disconnected';
  }

  public getMetrics() {
    return this.transport
      ? {
          ...this.transport.getMetrics(),
          lastHeartbeatAt: this.lastHeartbeatAt,
          latencyMs: this.transport.getMetrics().latencyMs || 0,
        }
      : { eventCount: 0, errorCount: 0, lastHeartbeatAt: 0, latencyMs: 0 };
  }

  public async startSync(): Promise<void> {
    this.isExplicitDisconnect = false;
    await this.connectTransport();
    this.startHeartbeatCheck();
  }

  public async stopSync(): Promise<void> {
    this.isExplicitDisconnect = true;
    this.stopHeartbeatCheck();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.transport) {
      await this.transport.disconnect();
      this.transport = null;
    }
  }

  private async connectTransport() {
    if (this.transport) {
      await this.transport.disconnect();
    }

    this.transport = createTransport(this.activeType, this.lastCheckpoint);
    
    this.transport.onStatusChange((status) => {
      console.log(`[RealtimeSyncManager] Transport "${this.activeType}" state: ${status}`);
      EventBus.publish('sync:status:changed', { type: this.activeType, status });

      if (status === 'connected') {
        this.currentBackoffMs = this.baseBackoffMs;
        this.lastHeartbeatAt = Date.now();
      } else if (status === 'error' && !this.isExplicitDisconnect) {
        this.scheduleReconnect();
      }
    });

    this.transport.onEvent((event) => {
      this.handleIncomingEvent(event);
    });

    try {
      await this.transport.connect();
    } catch (err) {
      console.error('[RealtimeSyncManager] Connection failed:', err);
      this.scheduleReconnect();
    }
  }

  private handleIncomingEvent(event: RealtimeEvent) {
    // Record last checkpoint based on event timestamp
    const eventTime = new Date(event.timestamp).getTime();
    if (eventTime > this.lastCheckpoint) {
      this.saveCheckpoint(eventTime);
    }

    // Heartbeat check
    if (event.name === 'heartbeat' || event.name === 'ping') {
      this.lastHeartbeatAt = Date.now();
      return;
    }

    // Publish to the frontend EventBus
    EventBus.publish(event.name, event.payload);
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout || this.isExplicitDisconnect) return;

    console.log(`[RealtimeSyncManager] Scheduling reconnect in ${this.currentBackoffMs}ms...`);
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      
      // Fallback strategy: if SSE fails repeatedly, fall back to Polling
      if (this.activeType === 'sse' && this.currentBackoffMs > 5000) {
        console.warn('[RealtimeSyncManager] SSE transport failing repeatedly. Falling back to Polling.');
        this.activeType = 'polling';
      }

      await this.connectTransport();
      
      // Exponential backoff
      this.currentBackoffMs = Math.min(this.currentBackoffMs * 2, this.maxBackoffMs);
    }, this.currentBackoffMs);
  }

  private reconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.connectTransport().catch(console.error);
  }

  private handleOnline() {
    console.log('[RealtimeSyncManager] Browser online event detected. Restoring synchronization.');
    this.reconnect();
  }

  private handleOffline() {
    console.warn('[RealtimeSyncManager] Browser offline event detected. Suspending synchronization.');
    if (this.transport) {
      this.transport.disconnect().catch(console.error);
    }
  }

  private startHeartbeatCheck() {
    this.stopHeartbeatCheck();
    this.lastHeartbeatAt = Date.now();
    this.heartbeatInterval = setInterval(() => {
      const timeSinceHeartbeat = Date.now() - this.lastHeartbeatAt;
      if (timeSinceHeartbeat > this.heartbeatTimeoutMs && this.getStatus() === 'connected') {
        console.warn(`[RealtimeSyncManager] Heartbeat timeout (${timeSinceHeartbeat}ms). Reconnecting.`);
        this.reconnect();
      }
    }, 5000);
  }

  private stopHeartbeatCheck() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const realtimeSyncManager = RealtimeSyncManager.getInstance();
