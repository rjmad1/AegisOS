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

import { serviceRegistry } from './ServiceRegistry';
import { configurationPlatform } from '../configuration/ConfigurationPlatform';
import { architectureValidator } from '../governance/ArchitectureValidator';
import { platformDiagnostics } from '../diagnostics/PlatformDiagnostics';
import { platformHealth } from '../health/PlatformHealth';

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

  /**
   * Boot the platform with the given modules, supporting retries and healing recovery.
   */
  async boot(modules: PlatformModule[]): Promise<void> {
    if (this.phase !== 'created' && this.phase !== 'stopped' && this.phase !== 'error') {
      console.warn(`[Kernel] Already in phase "${this.phase}", skipping boot.`);
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        await this.executeBootSequence(modules);
        return; // Success
      } catch (err: any) {
        retryCount++;
        console.error(`[Kernel] Boot sequence failed (Attempt ${retryCount}/${maxRetries}): ${err.message}`);
        this.phase = 'degraded';

        // Run recovery heuristics
        platformDiagnostics.reportError();
        const diagnosis = await platformDiagnostics.diagnoseAndHeal();
        console.log(`[Kernel:Recovery] Executed diagnostics:`, diagnosis.remediationsApplied);

        if (retryCount >= maxRetries) {
          this.phase = 'error';
          console.error('[Kernel] Unrecoverable platform bootstrap failure.');
          this.emit('platform:error', { error: err.message, timestamp: Date.now() });
          throw err;
        }

        // Exponential Backoff
        const delay = 500 * Math.pow(2, retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Internal execution of individual bootstrap stages.
   */
  private async executeBootSequence(modules: PlatformModule[]): Promise<void> {
    this.bootTime = Date.now();

    // 1. Stage: bootstrapping
    this.phase = 'bootstrapping';
    console.log('[Kernel] Boot sequence: bootstrapping...');

    // Load initial configurations
    configurationPlatform.reload();

    // Register all modules
    for (const mod of modules) {
      this.registerModule(mod);
    }

    // Register all services from modules in ServiceRegistry
    for (const mod of modules) {
      if (mod.services) {
        for (const svc of mod.services) {
          serviceRegistry.register(
            svc.token as string,
            () => svc.factory(),
            svc.singleton !== false ? 'singleton' : 'transient'
          );
          // Sync local mapping
          this.registerService(svc);
        }
      }
    }

    // 2. Stage: initializing
    this.phase = 'initializing';
    console.log('[Kernel] Boot sequence: initializing...');

    // Load DB overrides for configuration
    await configurationPlatform.loadFromDb();

    // Initialize modules
    for (const mod of this.modules.values()) {
      try {
        await mod.lifecycle?.onInit?.();
      } catch (err) {
        console.error(`[Kernel] Module "${mod.id}" onInit failed:`, err);
        throw err;
      }
    }

    // Initialize registered services
    await serviceRegistry.initializeServices();

    // 3. Stage: resolving
    this.phase = 'resolving';
    console.log('[Kernel] Boot sequence: resolving capabilities...');
    // Capabilities resolution is completed (dynamic registries binding)

    // 4. Stage: ready
    this.phase = 'ready';
    console.log('[Kernel] Boot sequence: verifying system fitness and health...');

    // Run architectural & circular dependency validation
    const archReport = architectureValidator.validate();
    if (!archReport.clean) {
      console.warn(`[Kernel] Architecture validator warnings found: ${archReport.violationsFound} issues.`);
      if (archReport.results.some(r => r.rule.includes('circular') && !r.passed)) {
        throw new Error('Fatal circular dependency in Service Registry configuration.');
      }
    }

    // Run platform health check
    const healthReport = await platformHealth.getHealthReport();
    if (healthReport.status === 'unhealthy') {
      throw new Error(`Critical platform component is unhealthy: ${healthReport.components.database.message}`);
    }

    this.emit('platform:ready', { timestamp: Date.now() });

    // 5. Stage: running
    this.phase = 'running';
    console.log('[Kernel] Boot sequence: triggering ready hooks...');

    // Execute onReady module lifecycle hooks
    for (const mod of this.modules.values()) {
      try {
        await mod.lifecycle?.onReady?.();
      } catch (err) {
        console.error(`[Kernel] Module "${mod.id}" onReady failed:`, err);
      }
    }

    console.log(`[Kernel] Boot complete — ${this.modules.size} modules operational.`);
  }

  /**
   * Shut down the kernel and clean up all resources.
   */
  async shutdown(): Promise<void> {
    this.phase = 'stopping';
    console.log('[Kernel] Shutdown initiated...');

    // Shutdown modules
    for (const mod of this.modules.values()) {
      try {
        await mod.lifecycle?.onDestroy?.();
      } catch (err) {
        console.error(`[Kernel] Module "${mod.id}" onDestroy failed:`, err);
      }
    }

    // Shutdown services in registry
    await serviceRegistry.shutdownServices();

    this.modules.clear();
    this.singletons.clear();
    this.serviceDescriptors.clear();
    this.phase = 'stopped';
    console.log('[Kernel] Shutdown complete.');
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

  // ---- Service Container ----

  registerService<T>(descriptor: ServiceDescriptor<T>): void {
    this.serviceDescriptors.set(descriptor.token as string, descriptor as ServiceDescriptor);
    // Ensure sync in serviceRegistry
    if (!serviceRegistry.has(descriptor.token as string)) {
      serviceRegistry.register(
        descriptor.token as string,
        () => descriptor.factory(),
        descriptor.singleton !== false ? 'singleton' : 'transient'
      );
    }
  }

  getService<T>(token: ServiceToken<T>): T {
    const key = token as string;
    // Resolve via advanced ServiceRegistry if exists
    if (serviceRegistry.has(key)) {
      return serviceRegistry.get<T>(key);
    }

    // Fallback for custom un-registered cached services
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
      serviceRegistry.registerValue(key, instance);
    }
    return instance;
  }

  hasService(token: string): boolean {
    return serviceRegistry.has(token) || this.serviceDescriptors.has(token);
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
export default PlatformKernel;
