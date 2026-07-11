// ============================================================================
// Real-time Transport Layer — Factory
// ============================================================================

import { RealtimeTransport, TransportType } from './types';
import { SSETransport } from './providers/SSETransport';
import { WebSocketTransport } from './providers/WebSocketTransport';
import { PollingTransport } from './providers/PollingTransport';

export function createTransport(type: TransportType, checkpointTimestamp?: number): RealtimeTransport {
  switch (type) {
    case 'sse':
      return new SSETransport(checkpointTimestamp);
    case 'websocket':
      return new WebSocketTransport();
    case 'polling':
      return new PollingTransport(checkpointTimestamp);
    default:
      throw new Error(`[RealtimeTransport] Unsupported transport: ${type}`);
  }
}
