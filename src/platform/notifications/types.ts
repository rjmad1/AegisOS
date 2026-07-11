// ============================================================================
// Notification Framework — Types
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'progress';

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
}

export interface PlatformNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  source?: string;
  actions?: NotificationAction[];
  progress?: number; // 0-100 for progress type
  persistent?: boolean;
  duration?: number; // ms before auto-dismiss (0 = no auto-dismiss)
}

export interface NotifyOptions {
  type: NotificationType;
  title: string;
  message: string;
  source?: string;
  actions?: NotificationAction[];
  progress?: number;
  persistent?: boolean;
  duration?: number;
}
