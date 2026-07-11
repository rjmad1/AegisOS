import { useNotificationStore } from '@/platform/notifications/NotificationService';

export function useNotifications() {
  const store = useNotificationStore();
  return {
    notifications: store.notifications,
    toasts: store.toasts,
    notify: store.notify,
    dismiss: store.dismiss,
    markRead: store.markRead,
    markAllRead: store.markAllRead,
    clear: store.clear,
    updateProgress: store.updateProgress,
    dismissToast: store.dismissToast,
  };
}
