export type NotificationType = "system" | "job" | "artifact" | "security" | "service";

export type Severity = "info" | "warning" | "error" | "success";

export type DeliveryChannel = "toast" | "alert" | "email" | "webhook" | "websocket";

export type WebSocketTopic =
  | "system:metrics"
  | "jobs:status"
  | "services:status"
  | "artifacts:lifecycle"
  | "notifications:raised";

export interface Notification {
  id: string;
  type: NotificationType;
  severity: Severity;
  title: string;
  message: string;
  createdAt: string;
  isPersistent: boolean;
  expiresAt?: string;
  isRead: boolean;
  readAt?: string;
  isDismissed: boolean;
  dismissedAt?: string;
  metadata?: Record<string, any>;
  channels: DeliveryChannel[];
}

export interface INotificationService {
  send(notification: Omit<Notification, "id" | "createdAt" | "isRead" | "isDismissed">): Promise<Notification>;
  markAsRead(id: string): Promise<boolean>;
  markAllAsRead(): Promise<void>;
  dismiss(id: string): Promise<boolean>;
  getNotifications(filter?: { severity?: Severity; isRead?: boolean; type?: NotificationType }): Promise<Notification[]>;
}

export interface IWebSocketConnectionContract {
  connectionId: string;
  status: "connecting" | "open" | "closing" | "closed";
  connect(url: string, token: string): Promise<void>;
  disconnect(): void;
  subscribe(topic: WebSocketTopic, callback: (message: any) => void): Promise<string>; // Returns subscription id
  unsubscribe(subscriptionId: string): Promise<void>;
}
