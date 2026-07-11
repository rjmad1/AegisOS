// ============================================================================
// Settings Framework — Types
// ============================================================================

export type SettingType = 'string' | 'number' | 'boolean' | 'select' | 'json';

export interface SettingDefinition {
  key: string;
  label: string;
  description?: string;
  type: SettingType;
  defaultValue: unknown;
  category: string;
  options?: { label: string; value: string }[];
  validation?: (value: unknown) => string | null;
  experimental?: boolean;
  restartRequired?: boolean;
}

export interface SettingsCategory {
  id: string;
  label: string;
  icon?: string;
  order?: number;
}
