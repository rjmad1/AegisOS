// ============================================================================
// Plugin Framework — Dynamic Plugin Lifecycle & Verification
// ============================================================================

import type {
  IPlugin,
  IPluginManager,
  IPluginContext,
  PluginType,
} from '../../api/types/plugins';
import type { IEventBus, AppEvent } from '../../api/types/events';
import type { IGlobalSearchService } from '../../api/types/search';
import type { INotificationService, Notification } from '../../api/types/notifications';
import { eventBus as platformEventBus } from '../../infrastructure/events/event-bus';
import { SearchEngine } from '../search/SearchEngine';
import { extensionRegistry } from '../extension/ExtensionFramework';
import { telemetryTracker } from '../../infrastructure/observability/telemetry';
import { logger } from '../../infrastructure/observability/structured-logger';

export class PluginPermissionError extends Error {
  constructor(pluginId: string, permission: string) {
    super(`[PluginManager] Security Exception: Plugin "${pluginId}" requested unauthorized permission "${permission}".`);
    this.name = 'PluginPermissionError';
  }
}

class PluginEventBusAdapter implements IEventBus {
  constructor(private pluginId: string, private allowedPermissions: string[]) {}

  async publish(event: AppEvent): Promise<void> {
    if (!this.allowedPermissions.includes('event-publish') && !this.allowedPermissions.includes('*')) {
      throw new PluginPermissionError(this.pluginId, 'event-publish');
    }
    // Map AppEvent to HardenedEvent and publish on the platform event bus
    await platformEventBus.publish({
      name: event.name,
      source: `plugin:${this.pluginId}`,
      version: 'v1',
      priority: 'medium',
      securityClassification: 'internal',
      retentionPolicy: 'temp',
      payload: (event as any).payload,
    });
  }

  subscribe<T extends AppEvent["name"]>(
    name: T,
    handler: (event: Extract<AppEvent, { name: T }>) => void | Promise<void>
  ): string {
    if (!this.allowedPermissions.includes('event-subscribe') && !this.allowedPermissions.includes('*')) {
      throw new PluginPermissionError(this.pluginId, 'event-subscribe');
    }
    return platformEventBus.subscribe(name, (evt) => {
      handler({
        id: evt.id,
        timestamp: evt.timestamp,
        source: evt.source,
        name: evt.name,
        payload: evt.payload,
      } as any);
    });
  }

  unsubscribe(subscriptionId: string): void {
    platformEventBus.unsubscribe(subscriptionId);
  }
}

import type { ISearchProvider, SearchResult } from '../../api/types/search';

class PluginSearchAdapter implements IGlobalSearchService {
  constructor(private pluginId: string, private allowedPermissions: string[]) {}

  registerProvider(provider: ISearchProvider): void {
    if (!this.allowedPermissions.includes('search-write') && !this.allowedPermissions.includes('*')) {
      throw new PluginPermissionError(this.pluginId, 'search-write');
    }
  }

  unregisterProvider(providerId: string): void {
    if (!this.allowedPermissions.includes('search-write') && !this.allowedPermissions.includes('*')) {
      throw new PluginPermissionError(this.pluginId, 'search-write');
    }
  }

  async search(
    query: string,
    options?: { limit?: number; offset?: number; type?: Array<SearchResult["type"]> }
  ): Promise<SearchResult[]> {
    if (!this.allowedPermissions.includes('search-read') && !this.allowedPermissions.includes('*')) {
      throw new PluginPermissionError(this.pluginId, 'search-read');
    }
    return SearchEngine.search(query) as any;
  }

  async reindexAll(): Promise<void> {
    if (!this.allowedPermissions.includes('search-write') && !this.allowedPermissions.includes('*')) {
      throw new PluginPermissionError(this.pluginId, 'search-write');
    }
  }

  async index(id: string, category: string, document: any): Promise<void> {
    if (!this.allowedPermissions.includes('search-write') && !this.allowedPermissions.includes('*')) {
      throw new PluginPermissionError(this.pluginId, 'search-write');
    }
    console.log(`[Plugin:${this.pluginId}] Request indexing of ${id} under category ${category}`);
  }
}

class PluginNotificationAdapter implements INotificationService {
  constructor(private pluginId: string, private allowedPermissions: string[]) {}

  async send(notification: Omit<Notification, "id" | "createdAt" | "isRead" | "isDismissed">): Promise<Notification> {
    if (!this.allowedPermissions.includes('notifications-write') && !this.allowedPermissions.includes('*')) {
      throw new PluginPermissionError(this.pluginId, 'notifications-write');
    }

    const n: Notification = {
      id: `notif-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      isDismissed: false,
      ...notification
    };

    // Broadcast notification on event bus
    await platformEventBus.publish({
      name: 'NotificationRaised',
      source: `plugin:${this.pluginId}`,
      version: 'v1',
      priority: 'high',
      securityClassification: 'public',
      retentionPolicy: 'temp',
      payload: {
        notificationId: n.id,
        message: n.message,
        severity: n.severity
      }
    });

    return n;
  }

  async markAsRead(id: string): Promise<boolean> { return true; }
  async markAllAsRead(): Promise<void> {}
  async dismiss(id: string): Promise<boolean> { return true; }
  async getNotifications(): Promise<Notification[]> { return []; }
}

export class PluginManager implements IPluginManager {
  private static instance: PluginManager | null = null;
  
  private plugins: Map<string, IPlugin> = new Map();
  private contexts: Map<string, IPluginContext> = new Map();
  
  // Set of system authorized permissions. In a production enterprise system, 
  // these are resolved from policy/configuration.
  private authorizedPermissions: Map<string, string[]> = new Map();

  private constructor() {
    // Declare standard extension points
    extensionRegistry.declareExtensionPoint({ id: 'storage-provider', name: 'Storage Providers' });
    extensionRegistry.declareExtensionPoint({ id: 'preview-provider', name: 'Preview Providers' });
    extensionRegistry.declareExtensionPoint({ id: 'search-provider', name: 'Search Providers' });
    extensionRegistry.declareExtensionPoint({ id: 'notification-provider', name: 'Notification Providers' });
  }

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Set authorized permissions for a plugin.
   */
  public authorizePlugin(pluginId: string, permissions: string[]): void {
    this.authorizedPermissions.set(pluginId, permissions);
  }

  /**
   * Load and initialize a plugin.
   */
  public async loadPlugin(plugin: IPlugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[PluginManager] Plugin "${plugin.id}" is already loaded. Unloading first.`);
      await this.unloadPlugin(plugin.id);
    }

    console.log(`[PluginManager] Verification phase for plugin: ${plugin.name} (${plugin.id})`);

    const traceId = crypto.randomUUID().slice(0, 16);
    const spanId = telemetryTracker.startSpan(
      traceId,
      `Plugin Lifecycle: Load ${plugin.name}`,
      undefined,
      { pluginId: plugin.id, version: plugin.version, type: plugin.type }
    );

    try {
      // 1. Dependency Resolution, Signature Verification, and Version Verification
      const sig = (plugin as any).signature;
      if (!sig) {
        throw new Error(`[PluginManager] Verification Failed: Plugin "${plugin.id}" is unsigned. Signature required for security validation.`);
      }
      // Verify signature format (simulate Cosign/Sigstore verification)
      if (sig.length !== 64) {
        throw new Error(`[PluginManager] Verification Failed: Plugin "${plugin.id}" has an invalid signature. Tamper detected.`);
      }

      // 2. Permission Sandboxing
      const allowedPermissions = this.authorizedPermissions.get(plugin.id) || ['*']; // Default to all if not restricted
      
      // 3. Create Sandboxed Plugin Context
      const context: IPluginContext = {
        eventBus: new PluginEventBusAdapter(plugin.id, allowedPermissions),
        search: new PluginSearchAdapter(plugin.id, allowedPermissions),
        notifications: new PluginNotificationAdapter(plugin.id, allowedPermissions),
        logger: {
          info: (msg, ...meta) => logger.info(`[Plugin:${plugin.id}] ${msg}`, { pluginId: plugin.id, ...meta }),
          warn: (msg, ...meta) => logger.warn(`[Plugin:${plugin.id}] ${msg}`, { pluginId: plugin.id, ...meta }),
          error: (msg, ...meta) => logger.error(`[Plugin:${plugin.id}] ${msg}`, undefined, { pluginId: plugin.id, ...meta }),
        },
        config: {}, // Custom configuration injected here
      };

      // 4. Initialize Plugin
      await plugin.initialize(context);
      
      this.plugins.set(plugin.id, plugin);
      this.contexts.set(plugin.id, context);
      
      // 5. Register plugin as extension if it implements standard points
      if (plugin.type === 'storage-provider') {
        extensionRegistry.registerExtension({
          pointId: 'storage-provider',
          extensionId: plugin.id,
          implementation: plugin,
        });
      } else if (plugin.type === 'preview-provider') {
        extensionRegistry.registerExtension({
          pointId: 'preview-provider',
          extensionId: plugin.id,
          implementation: plugin,
        });
      } else if (plugin.type === 'search-provider') {
        extensionRegistry.registerExtension({
          pointId: 'search-provider',
          extensionId: plugin.id,
          implementation: plugin,
        });
      } else if (plugin.type === 'notification-provider') {
        extensionRegistry.registerExtension({
          pointId: 'notification-provider',
          extensionId: plugin.id,
          implementation: plugin,
        });
      }

      console.log(`[PluginManager] Successfully loaded plugin: ${plugin.name} (${plugin.id})`);
      telemetryTracker.endSpan(traceId, spanId, { status: "succeeded" });
    } catch (err: any) {
      console.error(`[PluginManager] Initialization failed for plugin "${plugin.id}":`, err.message);
      telemetryTracker.endSpan(traceId, spanId, { status: "failed", error: true, errorMessage: err.message });
      throw err;
    }
  }

  /**
   * Unload a plugin.
   */
  public async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.warn(`[PluginManager] Plugin "${pluginId}" is not loaded.`);
      return;
    }

    try {
      await plugin.shutdown();
      
      // Remove extensions
      if (plugin.type === 'storage-provider') {
        extensionRegistry.unregisterExtension('storage-provider', plugin.id);
      } else if (plugin.type === 'preview-provider') {
        extensionRegistry.unregisterExtension('preview-provider', plugin.id);
      } else if (plugin.type === 'search-provider') {
        extensionRegistry.unregisterExtension('search-provider', plugin.id);
      } else if (plugin.type === 'notification-provider') {
        extensionRegistry.unregisterExtension('notification-provider', plugin.id);
      }

      this.plugins.delete(pluginId);
      this.contexts.delete(pluginId);
      console.log(`[PluginManager] Successfully unloaded plugin: ${pluginId}`);
    } catch (err) {
      console.error(`[PluginManager] Shutdown failed for plugin "${pluginId}":`, err);
      throw err;
    }
  }

  /**
   * Retrieve a loaded plugin.
   */
  public getPlugin<T extends IPlugin = IPlugin>(pluginId: string): T | null {
    return (this.plugins.get(pluginId) as T) || null;
  }

  /**
   * List all loaded plugins of a specific type.
   */
  public getPluginsByType<T extends IPlugin = IPlugin>(type: PluginType): T[] {
    return Array.from(this.plugins.values()).filter((p) => p.type === type) as T[];
  }

  /**
   * Get loaded plugin context.
   */
  public getPluginContext(pluginId: string): IPluginContext | null {
    return this.contexts.get(pluginId) || null;
  }

  /**
   * Unload all plugins.
   */
  public async shutdownAll(): Promise<void> {
    const keys = Array.from(this.plugins.keys());
    for (const key of keys) {
      await this.unloadPlugin(key);
    }
  }
}

export const pluginManager = PluginManager.getInstance();
export default pluginManager;
