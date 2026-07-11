// ============================================================================
// Layout Manager — Types
// ============================================================================

export type PanelDirection = 'horizontal' | 'vertical';

export interface PanelConfig {
  id: string;
  title: string;
  type: string; // 'widget' | 'custom'
  targetId?: string; // widget id
  size?: number; // percentage width or height
  collapsed?: boolean;
}

export interface PanelGroupConfig {
  id: string;
  direction: PanelDirection;
  panels: (PanelConfig | PanelGroupConfig)[];
  size?: number;
}

export interface LayoutConfig {
  id: string;
  name: string;
  root: PanelGroupConfig;
}

export interface WorkspaceProfile {
  id: string;
  name: string;
  description?: string;
  layout: LayoutConfig;
  isDefault?: boolean;
}
