// ============================================================================
// Layout Manager — Zustand-backed panel layout manager
// ============================================================================

import { create } from 'zustand';
import type { WorkspaceProfile, LayoutConfig } from './types';
import { EventBus } from '../event-bus/EventBus';

const STORAGE_KEY = 'platform:layout-profiles';

const DEFAULT_PROFILE: WorkspaceProfile = {
  id: 'profile-default',
  name: 'Default Workspace',
  description: 'Standard dashboard workspace layout',
  isDefault: true,
  layout: {
    id: 'layout-default',
    name: 'Default Layout',
    root: {
      id: 'root-group',
      direction: 'horizontal',
      panels: [
        {
          id: 'panel-sidebar-widget',
          title: 'System Status',
          type: 'widget',
          targetId: 'status-widget',
          size: 25,
        },
        {
          id: 'panel-main-content',
          title: 'Main View',
          type: 'custom',
          size: 75,
        }
      ]
    }
  }
};

interface LayoutState {
  profiles: WorkspaceProfile[];
  currentProfileId: string;

  loadProfile: (id: string) => void;
  saveProfile: (profile: WorkspaceProfile) => void;
  deleteProfile: (id: string) => void;
  updateCurrentLayout: (layout: LayoutConfig) => void;
  resetToDefault: () => void;
}

function loadPersistedProfiles(): WorkspaceProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // noop
  }
  return [DEFAULT_PROFILE];
}

function savePersistedProfiles(profiles: WorkspaceProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // noop
  }
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  profiles: typeof window !== 'undefined' ? loadPersistedProfiles() : [DEFAULT_PROFILE],
  currentProfileId: 'profile-default',

  loadProfile: (id) => {
    const exists = get().profiles.some((p) => p.id === id);
    if (exists) {
      set({ currentProfileId: id });
      EventBus.publish('layout:changed', { layoutId: id });
    }
  },

  saveProfile: (profile) => {
    set((state) => {
      const filtered = state.profiles.filter((p) => p.id !== profile.id);
      const updated = [...filtered, profile];
      savePersistedProfiles(updated);
      return { profiles: updated };
    });
    EventBus.publish('layout:changed', { layoutId: profile.id });
  },

  deleteProfile: (id) => {
    if (id === 'profile-default') return; // Cannot delete default
    set((state) => {
      const updated = state.profiles.filter((p) => p.id !== id);
      savePersistedProfiles(updated);
      const nextId = state.currentProfileId === id ? 'profile-default' : state.currentProfileId;
      return { profiles: updated, currentProfileId: nextId };
    });
  },

  updateCurrentLayout: (layout) => {
    set((state) => {
      const updated = state.profiles.map((p) => {
        if (p.id === state.currentProfileId) {
          return { ...p, layout };
        }
        return p;
      });
      savePersistedProfiles(updated);
      return { profiles: updated };
    });
    EventBus.publish('layout:changed', { layoutId: get().currentProfileId });
  },

  resetToDefault: () => {
    set({
      profiles: [DEFAULT_PROFILE],
      currentProfileId: 'profile-default'
    });
    savePersistedProfiles([DEFAULT_PROFILE]);
    EventBus.publish('layout:changed', { layoutId: 'profile-default' });
  }
}));

export const LayoutManager = {
  getCurrentProfile: () => {
    const state = useLayoutStore.getState();
    return state.profiles.find((p) => p.id === state.currentProfileId) || DEFAULT_PROFILE;
  },
  loadProfile: (id: string) => useLayoutStore.getState().loadProfile(id),
  saveProfile: (profile: WorkspaceProfile) => useLayoutStore.getState().saveProfile(profile),
  deleteProfile: (id: string) => useLayoutStore.getState().deleteProfile(id),
  updateCurrentLayout: (layout: LayoutConfig) => useLayoutStore.getState().updateCurrentLayout(layout),
  resetToDefault: () => useLayoutStore.getState().resetToDefault()
};
