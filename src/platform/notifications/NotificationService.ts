// ============================================================================
// Notification Service — Zustand-backed notification management
// ============================================================================

import { create } from 'zustand';
import type { PlatformNotification, NotifyOptions } from './types';
import { EventBus } from '../event-bus/EventBus';

let notifCounter = 0;

interface NotificationState {
  notifications: PlatformNotification[];
  toasts: PlatformNotification[];

  notify: (opts: NotifyOptions) => string;
  dismiss: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
  updateProgress: (id: string, progress: number) => void;
  dismissToast: (id: string) => void;
}

// Load notifications from local storage on startup
const loadInitialNotifications = (): PlatformNotification[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('aegisos_notifications');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveNotificationsToStorage = (notifications: PlatformNotification[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('aegisos_notifications', JSON.stringify(notifications.slice(0, 100)));
  } catch {}
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: loadInitialNotifications(),
  toasts: [],

  notify: (opts) => {
    const id = `notif-${++notifCounter}-${Date.now()}`;
    const timestamp = Date.now();

    // 1. Deduplication (skip duplicate messages received within 3s)
    const isDuplicate = get().notifications.some(
      (n) => n.title === opts.title && n.message === opts.message && timestamp - n.timestamp < 3000
    );
    if (isDuplicate) return '';

    // 2. Notification Grouping
    // If we receive multiple artifact creations within 5s, group them
    let displayTitle = opts.title;
    let displayMessage = opts.message;

    if (opts.source === 'artifact-registry' && opts.title === 'New Artifact Discovered') {
      const recentArtifactNotifications = get().notifications.filter(
        (n) => n.source === 'artifact-registry' && timestamp - n.timestamp < 5000
      );
      if (recentArtifactNotifications.length >= 2) {
        displayTitle = 'Multiple New Artifacts';
        displayMessage = `${recentArtifactNotifications.length + 1} new artifacts discovered in directory`;
        
        // Remove individual recent ones to collapse/group them
        const recentIds = recentArtifactNotifications.map(n => n.id);
        set((state) => ({
          notifications: state.notifications.filter(n => !recentIds.includes(n.id)),
          toasts: state.toasts.filter(n => !recentIds.includes(n.id)),
        }));
      }
    }

    const notification: PlatformNotification = {
      id,
      type: opts.type,
      title: displayTitle,
      message: displayMessage,
      timestamp,
      read: false,
      source: opts.source,
      actions: opts.actions,
      progress: opts.progress,
      persistent: opts.persistent ?? false,
      duration: opts.duration ?? (opts.type === 'error' ? 0 : 5000),
    };

    set((state) => {
      const updated = [notification, ...state.notifications].slice(0, 100);
      saveNotificationsToStorage(updated);
      return {
        notifications: updated,
        toasts: [notification, ...state.toasts],
      };
    });

    EventBus.publish('notification:created', {
      id,
      type: notification.type,
      title: notification.title,
    });

    // Auto-dismiss toast
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        get().dismissToast(id);
      }, notification.duration);
    }

    return id;
  },

  dismiss: (id) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      saveNotificationsToStorage(updated);
      return {
        notifications: updated,
        toasts: state.toasts.filter((n) => n.id !== id),
      };
    });
    EventBus.publish('notification:dismissed', { id });
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((n) => n.id !== id),
    }));
  },

  markRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveNotificationsToStorage(updated);
      return { notifications: updated };
    });
  },

  markAllRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      saveNotificationsToStorage(updated);
      return { notifications: updated };
    });
  },

  clear: () => {
    set({ notifications: [], toasts: [] });
    saveNotificationsToStorage([]);
    EventBus.publish('notification:cleared', {});
  },

  updateProgress: (id, progress) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, progress: Math.min(100, Math.max(0, progress)) } : n,
      ),
    }));
  },
}));

// Convenience function for non-React contexts
export function notify(opts: NotifyOptions): string {
  return useNotificationStore.getState().notify(opts);
}

// Subscribe to EventBus events to automatically generate notifications
if (typeof window !== 'undefined') {
  setTimeout(() => {
    // ArtifactCreated
    EventBus.subscribe('ArtifactCreated', (payload: any) => {
      const art = payload?.artifact;
      if (art) {
        notify({
          type: 'success',
          title: 'New Artifact Discovered',
          message: `File: ${art.name} (${art.type})`,
          source: 'artifact-registry',
          duration: 4000,
        });
      }
    });

    // ExecutionCompleted
    EventBus.subscribe('ExecutionCompleted', (payload: any) => {
      const exec = payload?.execution;
      if (exec) {
        notify({
          type: 'success',
          title: 'Execution Succeeded',
          message: `Task: ${exec.summary || exec.id}`,
          source: 'runtime-service',
          duration: 5000,
        });
      }
    });

    // ExecutionFailed
    EventBus.subscribe('ExecutionFailed', (payload: any) => {
      notify({
        type: 'error',
        title: 'Execution Failed',
        message: payload?.error || 'Task execution failed',
        source: 'runtime-service',
        duration: 0,
      });
    });

    // ProviderDisconnected
    EventBus.subscribe('ProviderDisconnected', (payload: any) => {
      notify({
        type: 'warning',
        title: 'Provider Offline',
        message: `${payload?.providerName || 'Provider'} has disconnected`,
        source: 'provider-registry',
        duration: 8000,
      });
    });

    // RuntimeHealthChanged
    EventBus.subscribe('RuntimeHealthChanged', (payload: any) => {
      const { current } = payload;
      if (current === 'degraded' || current === 'unhealthy') {
        notify({
          type: current === 'unhealthy' ? 'error' : 'warning',
          title: 'Runtime Status Alert',
          message: `Health state changed to: ${current}`,
          source: 'sync-scheduler',
          duration: 6000,
        });
      }
    });

    // ConfigurationChanged
    EventBus.subscribe('ConfigurationChanged', (payload: any) => {
      notify({
        type: 'info',
        title: 'Configuration Updated',
        message: `System configuration file was changed`,
        source: 'central-config',
        duration: 4000,
      });
    });
  }, 1500);
}
