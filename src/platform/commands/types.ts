// ============================================================================
// Command Palette — Types
// ============================================================================

import type { ComponentType } from 'react';

export type CommandCategory =
  | 'navigation'
  | 'commands'
  | 'settings'
  | 'search'
  | 'quick-actions'
  | string;

export interface PlatformCommand {
  id: string;
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  category: CommandCategory;
  shortcut?: string;
  action: () => void | Promise<void>;
  when?: () => boolean;
  isPinned?: boolean;
  priority?: number;
  moduleId?: string;
}
