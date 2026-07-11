// ============================================================================
// Module Registry — Dynamic module registration and querying
// ============================================================================

import type {
  PlatformModule,
  PlatformNavItem,
  PlatformRoute,
  PlatformCapability,
} from '../kernel/types';

class ModuleRegistryImpl {
  private modules: Map<string, PlatformModule> = new Map();

  register(mod: PlatformModule): void {
    this.modules.set(mod.id, mod);
  }

  unregister(id: string): void {
    this.modules.delete(id);
  }

  getModule(id: string): PlatformModule | undefined {
    return this.modules.get(id);
  }

  getAllModules(): PlatformModule[] {
    return Array.from(this.modules.values());
  }

  getModulesByCapability(cap: PlatformCapability): PlatformModule[] {
    return this.getAllModules().filter((m) => m.capabilities?.includes(cap));
  }

  getModulesByDomain(domain: string): PlatformModule[] {
    return this.getAllModules().filter((m) => m.domain === domain);
  }

  /** Aggregate all routes from all registered modules */
  getRoutes(): PlatformRoute[] {
    const routes: PlatformRoute[] = [];
    for (const mod of this.modules.values()) {
      if (mod.routes) routes.push(...mod.routes);
    }
    return routes;
  }

  /** Aggregate all nav items from all registered modules, sorted by order */
  getNavItems(): PlatformNavItem[] {
    const items: PlatformNavItem[] = [];
    for (const mod of this.modules.values()) {
      if (mod.navItems) items.push(...mod.navItems);
    }
    return items.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }

  /** Count of registered modules */
  get count(): number {
    return this.modules.size;
  }
}

export const ModuleRegistry = new ModuleRegistryImpl();
