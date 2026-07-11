// ============================================================================
// Navigation Service — Zustand-backed navigation and breadcrumbs manager
// ============================================================================

import { create } from 'zustand';
import type { NavigationEntry, NavigationGroup, Breadcrumb } from './types';
import { ModuleRegistry } from '../module-registry/ModuleRegistry';
import { EventBus } from '../event-bus/EventBus';

const STORAGE_FAVORITES_KEY = 'platform:navigation-favorites';
const STORAGE_RECENT_KEY = 'platform:navigation-recent';

interface NavigationState {
  favorites: string[]; // Paths
  recent: string[]; // Paths
  badges: Record<string, string | number>;
  
  addFavorite: (path: string) => void;
  removeFavorite: (path: string) => void;
  addRecent: (path: string) => void;
  clearRecent: () => void;
  getBreadcrumbs: (pathname: string) => Breadcrumb[];
  getNavigationGroups: () => NavigationGroup[];
}

function loadPersistedStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePersistedStringArray(key: string, val: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // noop
  }
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  favorites: typeof window !== 'undefined' ? loadPersistedStringArray(STORAGE_FAVORITES_KEY) : [],
  recent: typeof window !== 'undefined' ? loadPersistedStringArray(STORAGE_RECENT_KEY) : [],
  badges: {},

  addFavorite: (path) => {
    set((state) => {
      if (state.favorites.includes(path)) return {};
      const updated = [...state.favorites, path];
      savePersistedStringArray(STORAGE_FAVORITES_KEY, updated);
      return { favorites: updated };
    });
    EventBus.publish('navigation:favorite:added', { path });
  },

  removeFavorite: (path) => {
    set((state) => {
      const updated = state.favorites.filter((p) => p !== path);
      savePersistedStringArray(STORAGE_FAVORITES_KEY, updated);
      return { favorites: updated };
    });
    EventBus.publish('navigation:favorite:removed', { path });
  },

  addRecent: (path) => {
    set((state) => {
      const filtered = state.recent.filter((p) => p !== path);
      const updated = [path, ...filtered].slice(0, 10);
      savePersistedStringArray(STORAGE_RECENT_KEY, updated);
      return { recent: updated };
    });
  },

  clearRecent: () => {
    set({ recent: [] });
    savePersistedStringArray(STORAGE_RECENT_KEY, []);
  },

  getBreadcrumbs: (pathname) => {
    const parts = pathname.split('/').filter(Boolean);
    const breadcrumbs: Breadcrumb[] = [];
    let currentPath = '';

    // Always put Home or Console at start
    breadcrumbs.push({ label: 'Console', href: '/' });

    // Try to match registered module routes
    const registeredRoutes = ModuleRegistry.getRoutes();

    parts.forEach((part, index) => {
      currentPath += `/${part}`;
      const isLast = index === parts.length - 1;
      
      const routeMatch = registeredRoutes.find((r) => r.path === currentPath);
      let label = routeMatch?.label || part.charAt(0).toUpperCase() + part.slice(1);
      
      // Clean up dynamic IDs in breadcrumbs
      if (part.startsWith('art-') || part.length > 20) {
        label = 'Details';
      }

      breadcrumbs.push({ label, href: currentPath, isLast });
    });

    return breadcrumbs;
  },

  getNavigationGroups: () => {
    const navItems = ModuleRegistry.getNavItems();
    const groupsMap: Record<string, NavigationEntry[]> = {};

    navItems.forEach((item) => {
      const groupName = item.group || 'General';
      if (!groupsMap[groupName]) {
        groupsMap[groupName] = [];
      }
      groupsMap[groupName].push({
        id: item.id,
        label: item.label,
        href: item.href,
        icon: item.icon,
        group: item.group,
        order: item.order,
        badge: get().badges[item.id] ?? item.badge,
        hidden: item.hidden
      });
    });

    const groups: NavigationGroup[] = Object.entries(groupsMap).map(([name, items]) => {
      const sortedItems = items.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      let order = 99;
      if (name === 'Platform') order = 1;
      else if (name === 'Operations') order = 2;
      else if (name === 'Administration') order = 3;
      else if (name === 'Settings') order = 4;
      
      return {
        id: name.toLowerCase(),
        label: name,
        order,
        items: sortedItems
      };
    });

    return groups.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }
}));

// Setup automatic navigation badge syncing
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const updateCounts = async () => {
      try {
        const artRes = await fetch('/api/v1/artifacts?limit=1');
        const convRes = await fetch('/api/v1/conversations?limit=1');
        const execRes = await fetch('/api/v1/executions?limit=100');
        
        const badges: Record<string, string | number> = {};
        
        if (artRes.ok) {
          const artData = await artRes.json();
          if (artData.total > 0) badges['nav-artifacts'] = artData.total;
        }
        if (convRes.ok) {
          const convData = await convRes.json();
          if (convData.total > 0) badges['nav-conversations'] = convData.total;
        }
        if (execRes.ok) {
          const execData = await execRes.json();
          const runningCount = execData.executions?.filter((e: any) => e.status === 'running' || e.status === 'queued').length || 0;
          if (runningCount > 0) badges['nav-executions'] = runningCount;
        }
        
        useNavigationStore.setState({ badges });
      } catch (e) {
        console.error('[NavigationService] Failed to update nav badges:', e);
      }
    };

    updateCounts();

    const recountEvents = [
      'ArtifactCreated', 'ArtifactDeleted',
      'ConversationStarted', 'ConversationCompleted',
      'ExecutionStarted', 'ExecutionCompleted', 'ExecutionFailed'
    ];
    recountEvents.forEach((evt) => {
      EventBus.subscribe(evt, () => {
        setTimeout(updateCounts, 500);
      });
    });
  }, 2000);
}

export const NavigationService = {
  addFavorite: (path: string) => useNavigationStore.getState().addFavorite(path),
  removeFavorite: (path: string) => useNavigationStore.getState().removeFavorite(path),
  addRecent: (path: string) => useNavigationStore.getState().addRecent(path),
  clearRecent: () => useNavigationStore.getState().clearRecent(),
  getBreadcrumbs: (pathname: string) => useNavigationStore.getState().getBreadcrumbs(pathname),
  getNavigationGroups: () => useNavigationStore.getState().getNavigationGroups()
};
