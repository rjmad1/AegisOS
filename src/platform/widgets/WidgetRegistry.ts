// ============================================================================
// Widget Registry — Dynamic registration and query for dashboard widgets
// ============================================================================

import type { WidgetDefinition, WidgetCategory } from './types';

class WidgetRegistryImpl {
  private widgets: Map<string, WidgetDefinition> = new Map();

  register(widget: WidgetDefinition): void {
    this.widgets.set(widget.id, widget);
  }

  registerMany(widgets: WidgetDefinition[]): void {
    for (const w of widgets) this.register(w);
  }

  unregister(id: string): void {
    this.widgets.delete(id);
  }

  getWidget(id: string): WidgetDefinition | undefined {
    return this.widgets.get(id);
  }

  getAllWidgets(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }

  getByCategory(category: WidgetCategory): WidgetDefinition[] {
    return this.getAllWidgets().filter((w) => w.category === category);
  }

  getByModule(moduleId: string): WidgetDefinition[] {
    return this.getAllWidgets().filter((w) => w.moduleId === moduleId);
  }
}

export const WidgetRegistry = new WidgetRegistryImpl();
