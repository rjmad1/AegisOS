// ============================================================================
// Settings Framework — Default settings definitions
// ============================================================================

import type { SettingDefinition, SettingsCategory } from './types';

export const settingsCategories: SettingsCategory[] = [
  { id: 'appearance', label: 'Appearance', order: 1 },
  { id: 'platform', label: 'Platform', order: 2 },
  { id: 'storage', label: 'Storage', order: 3 },
  { id: 'providers', label: 'Providers', order: 4 },
  { id: 'features', label: 'Feature Flags', order: 5 },
  { id: 'experimental', label: 'Experimental', order: 6 },
];

export const defaultSettings: SettingDefinition[] = [
  // ---- Appearance ----
  {
    key: 'appearance.theme',
    label: 'Theme',
    description: 'Application color theme',
    type: 'select',
    defaultValue: 'dark',
    category: 'appearance',
    options: [
      { label: 'Dark', value: 'dark' },
      { label: 'Light', value: 'light' },
      { label: 'High Contrast', value: 'high-contrast' },
    ],
  },
  {
    key: 'appearance.fontSize',
    label: 'Font Size',
    description: 'Base font size in pixels',
    type: 'number',
    defaultValue: 14,
    category: 'appearance',
  },
  {
    key: 'appearance.fontFamily',
    label: 'Font Family',
    description: 'Primary font family',
    type: 'select',
    defaultValue: 'geist',
    category: 'appearance',
    options: [
      { label: 'Geist', value: 'geist' },
      { label: 'Inter', value: 'inter' },
      { label: 'System Default', value: 'system' },
    ],
  },
  {
    key: 'appearance.animations',
    label: 'Animations',
    description: 'Enable UI animations and transitions',
    type: 'boolean',
    defaultValue: true,
    category: 'appearance',
  },
  {
    key: 'appearance.sidebarCollapsed',
    label: 'Collapsed Sidebar',
    description: 'Start with sidebar collapsed',
    type: 'boolean',
    defaultValue: false,
    category: 'appearance',
  },

  // ---- Platform ----
  {
    key: 'platform.name',
    label: 'Platform Name',
    description: 'Display name for this platform instance',
    type: 'string',
    defaultValue: 'AI Ops Console',
    category: 'platform',
  },
  {
    key: 'platform.refreshInterval',
    label: 'Refresh Interval',
    description: 'Default data refresh interval in seconds',
    type: 'number',
    defaultValue: 30,
    category: 'platform',
  },

  // ---- Storage ----
  {
    key: 'storage.artifactsPath',
    label: 'Artifacts Storage Path',
    description: 'Root directory for artifact storage',
    type: 'string',
    defaultValue: './artifacts_storage',
    category: 'storage',
  },
  {
    key: 'storage.maxUploadSize',
    label: 'Max Upload Size (MB)',
    description: 'Maximum file upload size in megabytes',
    type: 'number',
    defaultValue: 50,
    category: 'storage',
  },

  // ---- Feature Flags ----
  {
    key: 'features.commandPalette',
    label: 'Command Palette',
    description: 'Enable the global command palette (Ctrl+Shift+P)',
    type: 'boolean',
    defaultValue: true,
    category: 'features',
  },
  {
    key: 'features.globalSearch',
    label: 'Global Search',
    description: 'Enable the global search overlay (Ctrl+K)',
    type: 'boolean',
    defaultValue: true,
    category: 'features',
  },

  // ---- Experimental ----
  {
    key: 'experimental.dockingLayout',
    label: 'Docking Layout',
    description: 'Enable IDE-style resizable panel layout',
    type: 'boolean',
    defaultValue: false,
    category: 'experimental',
    experimental: true,
  },
  {
    key: 'experimental.semanticSearch',
    label: 'Semantic Search',
    description: 'Enable AI-powered semantic search (requires future integration)',
    type: 'boolean',
    defaultValue: false,
    category: 'experimental',
    experimental: true,
  },
];
