// ============================================================================
// Event Bus — Strongly-typed event system (browser-compatible)
// ============================================================================

export type EventPriority = 'low' | 'normal' | 'high' | 'critical';

export interface EventHistoryEntry<T = unknown> {
  event: string;
  payload: T;
  timestamp: number;
  priority: EventPriority;
}

export interface EventSubscriptionOptions {
  priority?: EventPriority;
  once?: boolean;
}

export interface EventSubscription {
  id: string;
  event: string;
  priority: EventPriority;
  unsubscribe: () => void;
}

// ---------------------------------------------------------------------------
// Platform Event Map — extend this as new events are introduced
// ---------------------------------------------------------------------------

export interface PlatformEventMap {
  // Kernel lifecycle
  'platform:ready': { timestamp: number };
  'platform:error': { error: string; timestamp: number };

  // Module lifecycle
  'module:registered': { moduleId: string; moduleName: string };
  'module:unregistered': { moduleId: string };

  // Notifications
  'notification:created': { id: string; type: string; title: string };
  'notification:dismissed': { id: string };
  'notification:cleared': Record<string, never>;

  // Search
  'search:query': { query: string; timestamp: number };
  'search:results': { query: string; count: number };

  // Commands
  'command:executed': { commandId: string; timestamp: number };

  // Settings
  'settings:changed': { key: string; value: unknown; previous: unknown };

  // Navigation
  'navigation:changed': { path: string; previous?: string };
  'navigation:favorite:added': { path: string };
  'navigation:favorite:removed': { path: string };

  // Layout
  'layout:changed': { layoutId: string };
  'layout:panel:resized': { panelId: string; size: number };

  // Generic
  [key: string]: unknown;
}
