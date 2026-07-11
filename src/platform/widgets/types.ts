// ============================================================================
// Widget Framework — Types
// ============================================================================

import type { ComponentType } from 'react';

export type WidgetCategory = 'card' | 'table' | 'chart' | 'metric' | 'list' | 'activity' | 'status' | 'timeline';

export interface WidgetDefinition {
  id: string;
  title: string;
  description?: string;
  component: ComponentType<Record<string, unknown>>;
  category: WidgetCategory;
  defaultSize?: { w: number; h: number };
  resizable?: boolean;
  moduleId: string;
}
