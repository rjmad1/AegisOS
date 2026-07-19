import { ICompositionRoot, IModuleManifest, DependencyScope, ILifecycleContract, LifecycleState, StartupPhase } from './types';

export class CompositionRoot implements ICompositionRoot {
  private registries = new Map<symbol | string, any>();
  private modules: IModuleManifest[] = [];
  
  public register<T>(token: symbol | string, implementation: new (...args: any[]) => T, scope: DependencyScope): void {
    this.registries.set(token, { implementation, scope, type: 'class' });
  }

  public registerInstance<T>(token: symbol | string, instance: T): void {
    this.registries.set(token, { instance, scope: DependencyScope.SINGLETON, type: 'instance' });
  }

  public registerFactory<T>(token: symbol | string, factory: (container: ICompositionRoot) => T, scope: DependencyScope): void {
    this.registries.set(token, { factory, scope, type: 'factory' });
  }

  public resolve<T>(token: symbol | string): T {
    const registration = this.registries.get(token);
    if (!registration) {
      throw new Error(`Unresolved dependency: ${String(token)}`);
    }

    if (registration.type === 'instance') {
      return registration.instance as T;
    }

    if (registration.type === 'factory') {
      if (registration.scope === DependencyScope.SINGLETON && registration.cachedInstance) {
          return registration.cachedInstance as T;
      }
      const instance = registration.factory(this);
      if (registration.scope === DependencyScope.SINGLETON) {
          registration.cachedInstance = instance;
      }
      return instance as T;
    }

    if (registration.type === 'class') {
      if (registration.scope === DependencyScope.SINGLETON && registration.cachedInstance) {
          return registration.cachedInstance as T;
      }
      const instance = new registration.implementation();
      if (registration.scope === DependencyScope.SINGLETON) {
          registration.cachedInstance = instance;
      }
      return instance as T;
    }

    throw new Error(`Invalid registration for ${String(token)}`);
  }

  public registerModule(manifest: IModuleManifest): void {
    this.modules.push(manifest);
    manifest.register(this);
  }

  public async boot(): Promise<void> {
    this.modules.sort((a, b) => a.startupPhase - b.startupPhase);

    console.log('[CompositionRoot] Booting AegisOS Platform...');
    for (const mod of this.modules) {
        console.log(`[CompositionRoot] Starting phase: ${StartupPhase[mod.startupPhase]} (${mod.moduleId})`);
    }
    console.log('[CompositionRoot] Boot complete.');
  }

  public async shutdown(): Promise<void> {
    console.log('[CompositionRoot] Shutting down AegisOS Platform...');
    for (let i = this.modules.length - 1; i >= 0; i--) {
        const mod = this.modules[i];
        console.log(`[CompositionRoot] Shutting down module: ${mod.moduleId}`);
    }
  }
}
