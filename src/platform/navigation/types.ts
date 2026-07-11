// ============================================================================
// Navigation — Types
// ============================================================================

import type { ComponentType } from 'react';

export interface NavigationEntry {
  id: string;
  label: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  group?: string;
  order?: number;
  badge?: string | number;
  hidden?: boolean;
}

export interface NavigationGroup {
  id: string;
  label: string;
  order?: number;
  items: NavigationEntry[];
}

export interface Breadcrumb {
  label: string;
  href: string;
  isLast?: boolean;
}
