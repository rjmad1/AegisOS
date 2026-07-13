// ============================================================================
// Service Registry — Advanced Dependency Injection (DI) Container
// ============================================================================

export type ServiceLifetime = 'singleton' | 'transient' | 'scoped';

export interface ServiceDescriptor<T = any> {
  token: string | symbol;
  factory: (registry: ServiceRegistry) => T;
  lifetime: ServiceLifetime;
}

export class ServiceRegistry {
  private static globalInstance: ServiceRegistry | null = null;
  
  private descriptors: Map<string | symbol, ServiceDescriptor> = new Map();
  private singletons: Map<string | symbol, any> = new Map();
  private scopedInstances: Map<string | symbol, any> = new Map();
  private resolutionStack: Set<string | symbol> = new Set();
  
  // Track resolved instances with lifecycles to call hooks later
  private resolvedInstances: Set<any> = new Set();

  constructor(private parent?: ServiceRegistry) {}

  public static getGlobalInstance(): ServiceRegistry {
    if (!ServiceRegistry.globalInstance) {
      ServiceRegistry.globalInstance = new ServiceRegistry();
    }
    return ServiceRegistry.globalInstance;
  }

  /**
   * Register a service factory in the container.
   */
  public register<T>(
    token: string | symbol,
    factory: (registry: ServiceRegistry) => T,
    lifetime: ServiceLifetime = 'singleton'
  ): void {
    if (this.descriptors.has(token)) {
      console.warn(`[ServiceRegistry] Overwriting registration for token: ${String(token)}`);
    }
    this.descriptors.set(token, { token, factory, lifetime });
  }

  /**
   * Register a raw value. Automatically treated as a singleton.
   */
  public registerValue<T>(token: string | symbol, value: T): void {
    this.descriptors.set(token, {
      token,
      factory: () => value,
      lifetime: 'singleton'
    });
    this.singletons.set(token, value);
    this.resolvedInstances.add(value);
  }

  /**
   * Resolve a service token.
   */
  public get<T>(token: string | symbol): T {
    // 1. Detect circular dependencies
    if (this.resolutionStack.has(token)) {
      const path = Array.from(this.resolutionStack).map(t => String(t)).join(' -> ');
      throw new Error(`Circular dependency detected: ${path} -> ${String(token)}`);
    }

    // 2. Try parent container if not defined locally
    const descriptor = this.descriptors.get(token);
    if (!descriptor) {
      if (this.parent) {
        return this.parent.get<T>(token);
      }
      throw new Error(`Service not registered: ${String(token)}`);
    }

    // 3. Singleton Resolution
    if (descriptor.lifetime === 'singleton') {
      // Singletons are stored in the root/global container
      const root = this.getRoot();
      if (root !== this) {
        return root.get<T>(token);
      }
      if (this.singletons.has(token)) {
        return this.singletons.get(token) as T;
      }
    }

    // 4. Scoped Resolution
    if (descriptor.lifetime === 'scoped') {
      if (this.scopedInstances.has(token)) {
        return this.scopedInstances.get(token) as T;
      }
    }

    // 5. Instantiate Service
    this.resolutionStack.add(token);
    try {
      const instance = descriptor.factory(this);
      
      // Track hookable instances
      if (instance && (typeof instance.onInit === 'function' || typeof instance.onDestroy === 'function')) {
        this.resolvedInstances.add(instance);
      }

      if (descriptor.lifetime === 'singleton') {
        this.singletons.set(token, instance);
      } else if (descriptor.lifetime === 'scoped') {
        this.scopedInstances.set(token, instance);
      }

      return instance as T;
    } finally {
      this.resolutionStack.delete(token);
    }
  }

  /**
   * Check if a token is registered.
   */
  public has(token: string | symbol): boolean {
    if (this.descriptors.has(token)) return true;
    if (this.parent) return this.parent.has(token);
    return false;
  }

  /**
   * Create a new child scope for request-scoped services.
   */
  public createScope(): ServiceRegistry {
    const child = new ServiceRegistry(this);
    // Inherit descriptors
    for (const [token, desc] of this.descriptors.entries()) {
      child.descriptors.set(token, desc);
    }
    return child;
  }

  /**
   * Trigger the onInit hook on all resolved services.
   */
  public async initializeServices(): Promise<void> {
    for (const instance of this.resolvedInstances) {
      if (typeof instance.onInit === 'function') {
        try {
          await instance.onInit();
        } catch (err) {
          console.error(`[ServiceRegistry] Failed to initialize service instance:`, err);
          throw err;
        }
      }
    }
  }

  /**
   * Trigger the onDestroy hook on all resolved services.
   */
  public async shutdownServices(): Promise<void> {
    for (const instance of this.resolvedInstances) {
      if (typeof instance.onDestroy === 'function') {
        try {
          await instance.onDestroy();
        } catch (err) {
          console.error(`[ServiceRegistry] Failed to destroy service instance:`, err);
        }
      }
    }
    this.singletons.clear();
    this.scopedInstances.clear();
    this.resolvedInstances.clear();
  }

  /**
   * Run structural circular dependency checks over all registered descriptors.
   */
  public verifyCircularity(): void {
    for (const token of this.descriptors.keys()) {
      this.resolutionStack.clear();
      try {
        this.get(token);
      } catch (err: any) {
        if (err.message.includes('Circular dependency detected')) {
          throw err;
        }
      }
    }
    this.resolutionStack.clear();
  }

  private getRoot(): ServiceRegistry {
    let current: ServiceRegistry = this;
    while (current.parent) {
      current = current.parent;
    }
    return current;
  }
}

export const serviceRegistry = ServiceRegistry.getGlobalInstance();
export default serviceRegistry;
