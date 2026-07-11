// ============================================================================
// Real-time Transport Layer — Server-Sent Events (SSE) Provider
// ============================================================================

import { RealtimeTransport, ConnectionStatus, RealtimeEvent, TransportMetrics } from '../types';

export class SSETransport implements RealtimeTransport {
  type = 'sse' as const;
  status: ConnectionStatus = 'disconnected';

  private eventSource: EventSource | null = null;
  private eventHandlers: Set<(event: RealtimeEvent) => void> = new Set();
  private statusHandlers: Set<(status: ConnectionStatus) => void> = new Set();

  private metrics: TransportMetrics = {
    eventCount: 0,
    errorCount: 0,
  };

  constructor(private checkpointTimestamp?: number) {}

  private setStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      for (const handler of this.statusHandlers) {
        handler(newStatus);
      }
    }
  }

  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') return;

    this.setStatus('connecting');
    
    const queryParams = new URLSearchParams();
    if (this.checkpointTimestamp) {
      queryParams.append('since', this.checkpointTimestamp.toString());
    }

    try {
      const url = `/api/v1/events/stream?${queryParams.toString()}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.setStatus('connected');
      };

      this.eventSource.onerror = (err) => {
        console.error('[SSETransport] EventSource connection error:', err);
        this.metrics.errorCount++;
        this.setStatus('error');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          
          // Mapped canonical event
          const sseEvent: RealtimeEvent = {
            id: parsed.id || `evt-${Math.random().toString(36).slice(2, 9)}`,
            name: parsed.name,
            timestamp: parsed.timestamp || new Date().toISOString(),
            payload: parsed.payload,
            priority: parsed.priority,
            correlationId: parsed.correlationId,
            traceId: parsed.traceId,
          };

          this.metrics.eventCount++;
          this.metrics.lastEventAt = Date.now();
          
          if (parsed.timestamp) {
            const parsedTime = new Date(parsed.timestamp).getTime();
            this.metrics.latencyMs = Date.now() - parsedTime;
            this.checkpointTimestamp = parsedTime;
          }

          for (const handler of this.eventHandlers) {
            handler(sseEvent);
          }
        } catch (err) {
          console.error('[SSETransport] Failed to parse SSE event data:', err);
          this.metrics.errorCount++;
        }
      };
    } catch (err) {
      console.error('[SSETransport] Exception during EventSource creation:', err);
      this.metrics.errorCount++;
      this.setStatus('error');
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
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
    // Call immediately with current status
    handler(this.status);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  getMetrics(): TransportMetrics {
    return { ...this.metrics };
  }
}
