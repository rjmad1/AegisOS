// ============================================================================
// Real-time Transport Layer — WebSocket Provider (Future Integration)
// ============================================================================

import { RealtimeTransport, ConnectionStatus, RealtimeEvent, TransportMetrics } from '../types';

export class WebSocketTransport implements RealtimeTransport {
  type = 'websocket' as const;
  status: ConnectionStatus = 'disconnected';

  private eventHandlers: Set<(event: RealtimeEvent) => void> = new Set();
  private statusHandlers: Set<(status: ConnectionStatus) => void> = new Set();

  private metrics: TransportMetrics = {
    eventCount: 0,
    errorCount: 0,
  };

  private setStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      for (const handler of this.statusHandlers) {
        handler(newStatus);
      }
    }
  }

  async connect(): Promise<void> {
    this.setStatus('connecting');
    console.warn('[WebSocketTransport] WebSocket transport is planned for a future release. SSE and Polling are currently active.');
    // Simulated connection error to trigger fallback mechanisms
    setTimeout(() => {
      this.metrics.errorCount++;
      this.setStatus('error');
    }, 500);
  }

  async disconnect(): Promise<void> {
    this.setStatus('disconnected');
  }

  onEvent(handler: (event: RealtimeEvent) => void): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);
    handler(this.status);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  getMetrics(): TransportMetrics {
    return { ...this.metrics };
  }
}
