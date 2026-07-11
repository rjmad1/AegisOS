// ============================================================================
// Platform Kernel — Central orchestrator for the modular platform
// ============================================================================

import type {
  PlatformModule,
  ServiceToken,
  ServiceDescriptor,
  LifecyclePhase,
  HealthReport,
  HealthStatus,
  ModuleHealthEntry,
} from './types';
import { ModuleRegistry } from '../module-registry/ModuleRegistry';
import { CommandRegistry } from '../commands/CommandRegistry';
import { WidgetRegistry } from '../widgets/WidgetRegistry';
import { SearchEngine } from '../search/SearchEngine';
import { useSettingsStore } from '../settings/SettingsService';
import { PermissionService } from '../permissions/PermissionService';

class PlatformKernelImpl {
  // ---- State ----
  private phase: LifecyclePhase = 'created';
  private bootTime = 0;
  private modules: Map<string, PlatformModule> = new Map();
  private singletons: Map<string, unknown> = new Map();
  private serviceDescriptors: Map<string, ServiceDescriptor> = new Map();
  private listeners: Map<string, Array<(...args: unknown[]) => void>> = new Map();

  // ---- Lifecycle ----

  get currentPhase(): LifecyclePhase {
    return this.phase;
  }

  async boot(modules: PlatformModule[]): Promise<void> {
    if (this.phase !== 'created' && this.phase !== 'stopped') {
      console.warn(`[Kernel] Already in phase "${this.phase}", skipping boot.`);
      return;
    }

    this.phase = 'initializing';
    this.bootTime = Date.now();
    console.log('[Kernel] Boot sequence started');

    // 1. Register all modules
    for (const mod of modules) {
      this.registerModule(mod);
    }

    // 2. Register services from modules
    for (const mod of modules) {
      if (mod.services) {
        for (const svc of mod.services) {
          this.registerService(svc);
        }
      }
    }

    // 3. Initialize modules (call lifecycle hooks)
    for (const mod of modules) {
      try {
        await mod.lifecycle?.onInit?.();
      } catch (err) {
        console.error(`[Kernel] Module "${mod.id}" onInit failed:`, err);
      }
    }

    this.phase = 'ready';
    this.emit('platform:ready', { timestamp: Date.now() });

    // 4. Fire onReady hooks
    for (const mod of modules) {
      try {
        await mod.lifecycle?.onReady?.();
      } catch (err) {
        console.error(`[Kernel] Module "${mod.id}" onReady failed:`, err);
      }
    }

    this.phase = 'running';
    console.log(`[Kernel] Boot complete — ${this.modules.size} modules loaded`);
  }

  async shutdown(): Promise<void> {
    this.phase = 'stopping';

    for (const mod of this.modules.values()) {
      try {
        await mod.lifecycle?.onDestroy?.();
      } catch (err) {
        console.error(`[Kernel] Module "${mod.id}" onDestroy failed:`, err);
      }
    }

    this.modules.clear();
    this.singletons.clear();
    this.serviceDescriptors.clear();
    this.phase = 'stopped';
    console.log('[Kernel] Shutdown complete');
  }

  // ---- Module Registration ----

  registerModule(mod: PlatformModule): void {
    if (this.modules.has(mod.id)) {
      console.warn(`[Kernel] Module "${mod.id}" already registered — replacing.`);
    }
    this.modules.set(mod.id, mod);
    
    // Register with ModuleRegistry
    ModuleRegistry.register(mod);

    // Register module commands
    if (mod.commands) {
      const commandsWithModule = mod.commands.map(cmd => ({
        ...cmd,
        category: cmd.category || 'commands',
        moduleId: mod.id
      }));
      CommandRegistry.registerMany(commandsWithModule);
    }

    // Register module widgets
    if (mod.widgets) {
      const widgetsWithModule = mod.widgets.map(w => ({
        ...w,
        category: w.category || 'card',
        moduleId: mod.id
      }));
      WidgetRegistry.registerMany(widgetsWithModule);
    }

    // Register search providers
    if (mod.searchProviders) {
      mod.searchProviders.forEach(provider => {
        SearchEngine.registerProvider({
          id: provider.id,
          name: provider.name,
          category: provider.category,
          search: async (query) => {
            const results = await provider.search(query);
            return results.map(item => ({
              ...item,
              score: item.score ?? 0
            }));
          }
        });
      });
    }

    // Register settings
    if (mod.settingsDefinitions) {
      useSettingsStore.getState().registerSettings(
        mod.settingsDefinitions.map(def => ({
          ...def,
          category: def.category || 'platform'
        }))
      );
    }

    // Register permissions
    if (mod.permissions) {
      PermissionService.registerPermissions(
        mod.permissions.map(perm => ({
          resource: perm,
          action: 'execute',
          minimumRole: 'administrator'
        }))
      );
    }

    this.emit('module:registered', { moduleId: mod.id, moduleName: mod.name });
  }

  unregisterModule(moduleId: string): void {
    const mod = this.modules.get(moduleId);
    if (mod) {
      mod.lifecycle?.onDestroy?.();
      
      // Clean up registries
      ModuleRegistry.unregister(moduleId);
      if (mod.commands) {
        mod.commands.forEach(cmd => CommandRegistry.unregister(cmd.id));
      }
      if (mod.widgets) {
        mod.widgets.forEach(w => WidgetRegistry.unregister(w.id));
      }
      if (mod.searchProviders) {
        mod.searchProviders.forEach(provider => SearchEngine.unregisterProvider(provider.id));
      }
      
      this.modules.delete(moduleId);
      this.emit('module:unregistered', { moduleId });
    }
  }

  getModule(moduleId: string): PlatformModule | undefined {
    return this.modules.get(moduleId);
  }

  getAllModules(): PlatformModule[] {
    return Array.from(this.modules.values());
  }

  // ---- Service Container (simple DI) ----

  registerService<T>(descriptor: ServiceDescriptor<T>): void {
    this.serviceDescriptors.set(descriptor.token as string, descriptor as ServiceDescriptor);
  }

  getService<T>(token: ServiceToken<T>): T {
    const key = token as string;

    // Return cached singleton
    if (this.singletons.has(key)) {
      return this.singletons.get(key) as T;
    }

    const descriptor = this.serviceDescriptors.get(key);
    if (!descriptor) {
      throw new Error(`[Kernel] Service "${key}" not registered`);
    }

    const instance = descriptor.factory() as T;
    if (descriptor.singleton !== false) {
      this.singletons.set(key, instance);
    }
    return instance;
  }

  hasService(token: string): boolean {
    return this.serviceDescriptors.has(token);
  }

  // ---- Health ----

  getHealth(): HealthReport {
    const moduleEntries: ModuleHealthEntry[] = [];
    let worstStatus: HealthStatus = 'healthy';

    for (const mod of this.modules.values()) {
      if (mod.getHealth) {
        const entry = mod.getHealth();
        moduleEntries.push(entry);
        if (entry.status === 'unhealthy') worstStatus = 'unhealthy';
        else if (entry.status === 'degraded' && worstStatus !== 'unhealthy') worstStatus = 'degraded';
      } else {
        moduleEntries.push({
          moduleId: mod.id,
          moduleName: mod.name,
          status: 'healthy',
        });
      }
    }

    return {
      status: worstStatus,
      uptime: Date.now() - this.bootTime,
      phase: this.phase,
      modules: moduleEntries,
      timestamp: Date.now(),
    };
  }

  // ---- Minimal internal event emitter (for kernel-level lifecycle events) ----

  on(event: string, handler: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  off(event: string, handler: (...args: unknown[]) => void): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      this.listeners.set(
        event,
        handlers.filter((h) => h !== handler),
      );
    }
  }

  private emit(event: string, payload?: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[Kernel] Event handler error for "${event}":`, err);
        }
      }
    }
  }
}

// Singleton
export const PlatformKernel = new PlatformKernelImpl();
