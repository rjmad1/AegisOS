// ============================================================================
// Settings Service — Zustand-backed centralized settings management
// ============================================================================

import { create } from 'zustand';
import type { SettingDefinition } from './types';
import { defaultSettings } from './defaults';
import { EventBus } from '../event-bus/EventBus';

const STORAGE_KEY = 'platform:settings';
const SCHEMA_VERSION = 1;

interface PersistedSettings {
  version: number;
  values: Record<string, unknown>;
}

interface SettingsState {
  definitions: SettingDefinition[];
  values: Record<string, unknown>;

  /** Register additional setting definitions (from modules) */
  registerSettings: (defs: SettingDefinition[]) => void;
  /** Get a setting value */
  get: <T = unknown>(key: string) => T;
  /** Set a setting value */
  set: (key: string, value: unknown) => void;
  /** Reset a setting to its default */
  reset: (key: string) => void;
  /** Reset all settings to defaults */
  resetAll: () => void;
  /** Get all definitions for a category */
  getByCategory: (category: string) => SettingDefinition[];
  /** Export all settings as JSON string */
  exportSettings: () => string;
  /** Import settings from JSON string */
  importSettings: (json: string) => boolean;
}

function loadPersisted(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: PersistedSettings = JSON.parse(raw);
      if (parsed.version === SCHEMA_VERSION) return parsed.values;
    }
  } catch {
    // noop
  }
  return {};
}

function savePersisted(values: Record<string, unknown>): void {
  try {
    const data: PersistedSettings = { version: SCHEMA_VERSION, values };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // noop
  }
}

function getDefaults(definitions: SettingDefinition[]): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  for (const def of definitions) {
    map[def.key] = def.defaultValue;
  }
  return map;
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const persisted = loadPersisted();
  const defaults = getDefaults(defaultSettings);

  return {
    definitions: [...defaultSettings],
    values: { ...defaults, ...persisted },

    registerSettings: (defs) => {
      set((state) => {
        const newDefs = [...state.definitions];
        const newValues = { ...state.values };
        for (const def of defs) {
          if (!newDefs.find((d) => d.key === def.key)) {
            newDefs.push(def);
          }
          if (!(def.key in newValues)) {
            newValues[def.key] = def.defaultValue;
          }
        }
        return { definitions: newDefs, values: newValues };
      });
    },

    get: <T,>(key: string): T => {
      const state = get();
      if (key in state.values) return state.values[key] as T;
      const def = state.definitions.find((d) => d.key === key);
      return (def?.defaultValue ?? undefined) as T;
    },

    set: (key, value) => {
      const previous = get().values[key];
      set((state) => {
        const newValues = { ...state.values, [key]: value };
        savePersisted(newValues);
        return { values: newValues };
      });
      EventBus.publish('settings:changed', { key, value, previous });
    },

    reset: (key) => {
      const def = get().definitions.find((d) => d.key === key);
      if (def) {
        get().set(key, def.defaultValue);
      }
    },

    resetAll: () => {
      const defaults = getDefaults(get().definitions);
      set({ values: defaults });
      savePersisted(defaults);
    },

    getByCategory: (category) => {
      return get().definitions.filter((d) => d.category === category);
    },

    exportSettings: () => {
      return JSON.stringify({ version: SCHEMA_VERSION, values: get().values }, null, 2);
    },

    importSettings: (json) => {
      try {
        const parsed: PersistedSettings = JSON.parse(json);
        if (parsed.version === SCHEMA_VERSION && parsed.values) {
          set({ values: { ...getDefaults(get().definitions), ...parsed.values } });
          savePersisted(parsed.values);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
  };
});
