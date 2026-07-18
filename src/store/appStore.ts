import { create } from "zustand";

export interface SystemNotification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export type PersonaPerspective =
  | "developer"
  | "research"
  | "product"
  | "operations"
  | "executive"
  | "personal";

interface AppState {
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "high-contrast";
  notifications: SystemNotification[];
  systemStatus: "healthy" | "degraded" | "failed";
  activeNavId: string;
  activePerspective: PersonaPerspective;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark" | "high-contrast") => void;
  setActiveNavId: (id: string) => void;
  setActivePerspective: (perspective: PersonaPerspective) => void;
  addNotification: (notification: Omit<SystemNotification, "id" | "timestamp" | "read">) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  theme: "dark",
  systemStatus: "healthy",
  activeNavId: "dashboard",
  activePerspective: "developer",
  notifications: [
    {
      id: "nt-01",
      type: "success",
      title: "System Initialization",
      message: "AI Operations Console initialized successfully on port 3000.",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      read: false,
    },
    {
      id: "nt-02",
      type: "info",
      title: "Ollama Connected",
      message: "Established loopback tunnel to Ollama service (127.0.0.1:11434).",
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
      read: false,
    },
    {
      id: "nt-03",
      type: "warning",
      title: "VRAM Memory Usage",
      message: "RTX 5080 VRAM utilization is at 82%.",
      timestamp: new Date(Date.now() - 30 * 1000), // 30s ago
      read: false,
    },
  ],

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark", "high-contrast");
      root.classList.add(theme);
      localStorage.setItem("theme", theme);
    }
    set({ theme });
  },
  setActiveNavId: (activeNavId) => set({ activeNavId }),
  setActivePerspective: (activePerspective) => set({ activePerspective }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: `nt-${Date.now()}`,
          timestamp: new Date(),
          read: false,
        },
        ...state.notifications,
      ],
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
