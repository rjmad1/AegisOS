// ============================================================================
// Real-time Transport Layer — Types
// ============================================================================

export type TransportType = 'sse' | 'websocket' | 'polling';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RealtimeEvent<T = any> {
  id: string;
  name: string;
  timestamp: string;
  payload: T;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  correlationId?: string;
  traceId?: string;
}

export interface TransportMetrics {
  eventCount: number;
  lastEventAt?: number;
  latencyMs?: number;
  errorCount: number;
}

export interface RealtimeTransport {
  type: TransportType;
  status: ConnectionStatus;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  onEvent(handler: (event: RealtimeEvent) => void): () => void;
  onStatusChange(handler: (status: ConnectionStatus) => void): () => void;
  
  getMetrics(): TransportMetrics;
}
