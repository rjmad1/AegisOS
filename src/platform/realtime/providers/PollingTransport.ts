// ============================================================================
// Real-time Transport Layer — Polling Fallback Provider
// ============================================================================

import { RealtimeTransport, ConnectionStatus, RealtimeEvent, TransportMetrics } from '../types';

export class PollingTransport implements RealtimeTransport {
  type = 'polling' as const;
  status: ConnectionStatus = 'disconnected';

  private pollInterval: any = null;
  private eventHandlers: Set<(event: RealtimeEvent) => void> = new Set();
  private statusHandlers: Set<(status: ConnectionStatus) => void> = new Set();

  private metrics: TransportMetrics = {
    eventCount: 0,
    errorCount: 0,
  };

  private intervalMs = 4000;

  constructor(private checkpointTimestamp?: number) {
    if (!this.checkpointTimestamp) {
      this.checkpointTimestamp = Date.now();
    }
  }

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

    // Run first check immediately, then schedule interval
    const fetchEvents = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (this.checkpointTimestamp) {
          queryParams.append('since', this.checkpointTimestamp.toString());
        }

        const res = await fetch(`/api/v1/events?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to poll events: ${res.statusText}`);
        }

        const data = await res.json();
        const events: any[] = data.events || [];

        this.setStatus('connected');

        let maxTimestamp = this.checkpointTimestamp || 0;
        
        for (const raw of events) {
          const eventTime = new Date(raw.timestamp).getTime();
          if (eventTime > maxTimestamp) {
            maxTimestamp = eventTime;
          }

          const realtimeEvent: RealtimeEvent = {
            id: raw.id,
            name: raw.name,
            timestamp: raw.timestamp,
            payload: raw.payload,
            priority: raw.priority,
            correlationId: raw.correlationId,
            traceId: raw.traceId,
          };

          this.metrics.eventCount++;
          this.metrics.lastEventAt = Date.now();
          this.metrics.latencyMs = Date.now() - eventTime;

          for (const handler of this.eventHandlers) {
            handler(realtimeEvent);
          }
        }

        this.checkpointTimestamp = maxTimestamp || this.checkpointTimestamp;
      } catch (err) {
        console.error('[PollingTransport] Polling error:', err);
        this.metrics.errorCount++;
        this.setStatus('error');
      }
    };

    await fetchEvents();
    this.pollInterval = setInterval(fetchEvents, this.intervalMs);
  }

  async disconnect(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
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
    handler(this.status);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  getMetrics(): TransportMetrics {
    return { ...this.metrics };
  }
}
