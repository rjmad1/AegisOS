import { WidgetRegistry } from '@/platform/widgets/WidgetRegistry';

export function useWidgets() {
  return {
    register: WidgetRegistry.register.bind(WidgetRegistry),
    unregister: WidgetRegistry.unregister.bind(WidgetRegistry),
    getAll: WidgetRegistry.getAllWidgets.bind(WidgetRegistry),
    getByCategory: WidgetRegistry.getByCategory.bind(WidgetRegistry),
    getByModule: WidgetRegistry.getByModule.bind(WidgetRegistry),
  };
}
