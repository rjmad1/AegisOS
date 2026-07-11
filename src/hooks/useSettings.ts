import { useSettingsStore } from '@/platform/settings/SettingsService';

export function useSettings() {
  const store = useSettingsStore();
  return {
    values: store.values,
    definitions: store.definitions,
    get: store.get,
    set: store.set,
    reset: store.reset,
    resetAll: store.resetAll,
    getByCategory: store.getByCategory,
    exportSettings: store.exportSettings,
    importSettings: store.importSettings,
  };
}
