import { IEventBus } from "./events";
import { IGlobalSearchService } from "./search";
import { INotificationService } from "./notifications";

export interface IPluginContext {
  eventBus: IEventBus;
  search: IGlobalSearchService;
  notifications: INotificationService;
  logger: {
    info(message: string, ...meta: any[]): void;
    warn(message: string, ...meta: any[]): void;
    error(message: string, ...meta: any[]): void;
  };
  config: Record<string, any>;
}

export type PluginType =
  | "artifact-provider"
  | "storage-provider"
  | "preview-provider"
  | "search-provider"
  | "export-provider"
  | "notification-provider";

export interface IPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: PluginType;
  initialize(context: IPluginContext): Promise<void>;
  shutdown(): Promise<void>;
}

export interface IArtifactProviderPlugin extends IPlugin {
  type: "artifact-provider";
  supportedMimeTypes: string[];
  extractMetadata(fileUri: string, mimeType: string): Promise<Record<string, any>>;
}

export interface IStorageProviderPlugin extends IPlugin {
  type: "storage-provider";
  scheme: string; // e.g. "s3", "gcs", "local"
  save(key: string, data: Uint8Array | ReadableStream, mimeType: string): Promise<string>; // Returns URI
  read(uri: string): Promise<Uint8Array | ReadableStream>;
  delete(uri: string): Promise<boolean>;
  exists(uri: string): Promise<boolean>;
}

export interface IPreviewProviderPlugin extends IPlugin {
  type: "preview-provider";
  supportedExtensions: string[];
  generatePreview(uri: string, mimeType: string): Promise<{
    previewUri: string;
    previewMimeType: string;
    isInteractive: boolean;
  }>;
}

export interface ISearchProviderPlugin extends IPlugin {
  type: "search-provider";
  indexName: string;
  index(id: string, data: Record<string, any>): Promise<void>;
  delete(id: string): Promise<void>;
  query(text: string, limit?: number): Promise<Array<{ id: string; score: number }>>;
}

export interface IExportProviderPlugin extends IPlugin {
  type: "export-provider";
  supportedTargetFormats: string[];
  export(artifactId: string, targetFormat: string): Promise<{
    data: Uint8Array;
    mimeType: string;
    fileName: string;
  }>;
}

export interface INotificationProviderPlugin extends IPlugin {
  type: "notification-provider";
  channelName: string; // e.g. "slack", "discord", "pushover"
  deliver(title: string, message: string, severity: "info" | "warning" | "error" | "success"): Promise<boolean>;
}

export interface IPluginManager {
  loadPlugin(plugin: IPlugin): Promise<void>;
  unloadPlugin(pluginId: string): Promise<void>;
  getPlugin<T extends IPlugin = IPlugin>(pluginId: string): T | null;
  getPluginsByType<T extends IPlugin = IPlugin>(type: PluginType): T[];
}
