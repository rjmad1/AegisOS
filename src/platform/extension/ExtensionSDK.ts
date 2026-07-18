// src/platform/extension/ExtensionSDK.ts
// SDK defining standard manifest structures, contexts, and interface contracts for extensions.

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  dependencies: Record<string, string>; // e.g., { "aegisos": ">=1.0.0", "com.aegisos.ext.logger": ">=1.0.0" }
  capabilities: string[]; // List of capability tokens offered by the extension
  permissions: string[]; // Required permissions, e.g. ["fs:read", "network:outbound"]
  signature?: string; // Verification signature
  entryPoints?: {
    main?: string; // Relative path to script/index.js if containing custom initialization logic
  };
  compatibility?: {
    aegisos: string;
  };
  upgradeRules?: {
    autoUpdate?: boolean;
    rollbackSupported?: boolean;
  };
  migrationRules?: {
    schemaVersion?: number;
    migrationScript?: string;
  };

  // Declarative registry entries
  agents?: Array<{
    agentId: string;
    name: string;
    role: string;
    models: string[];
    mcpServers?: string[];
  }>;
  prompts?: Array<{
    name: string;
    purpose: string;
    template: string;
  }>;
  workflows?: Array<{
    id: string;
    name: string;
    description: string;
    version: string;
    status: "active" | "draft" | "deprecated";
    nodes: any[];
    capabilities: string[];
    dependencies: string[];
    relationships: any[];
    metadata?: Record<string, any>;
  }>;
  tools?: Array<{
    id: string;
    name: string;
    description: string;
    parameters: any; // JSON Schema
    permissionsRequired: string[];
    sandboxLevel: "full" | "partial" | "none";
    enabled: boolean;
  }>;
  uiContributions?: Array<{
    id: string;
    label: string;
    href: string;
    group?: string;
    order?: number;
  }>;
  mobileContributions?: Array<{
    id: string;
    label: string;
    enabledByDefault: boolean;
    features: string[];
  }>;
  localization?: Record<string, Record<string, string>>; // lang -> key -> translation
}

export interface ExtensionLogger {
  info(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  error(message: string, error?: Error, ...meta: any[]): void;
}

export interface ExtensionContext {
  extensionId: string;
  manifest: ExtensionManifest;
  logger: ExtensionLogger;
  config: Record<string, any>;
  eventBus: {
    publish(name: string, payload: any): Promise<void>;
    subscribe(name: string, handler: (event: any) => void): string;
    unsubscribe(subscriptionId: string): void;
  };
}

export interface IExtension {
  initialize(context: ExtensionContext): Promise<void>;
  shutdown(): Promise<void>;
}
