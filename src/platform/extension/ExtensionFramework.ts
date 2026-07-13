// ============================================================================
// Extension Framework — Extension Points & Extensions
// ============================================================================

export interface ExtensionPointDescriptor {
  id: string;
  name: string;
  description?: string;
  schema?: any; // Config/Interface validation schema
}

export interface ExtensionDescriptor<T = any> {
  pointId: string;
  extensionId: string;
  implementation: T;
  priority?: number; // Higher numbers resolved first
  metadata?: Record<string, any>;
}

export class ExtensionRegistry {
  private static instance: ExtensionRegistry | null = null;

  private points: Map<string, ExtensionPointDescriptor> = new Map();
  private extensions: Map<string, ExtensionDescriptor[]> = new Map();

  private constructor() {}

  public static getInstance(): ExtensionRegistry {
    if (!ExtensionRegistry.instance) {
      ExtensionRegistry.instance = new ExtensionRegistry();
    }
    return ExtensionRegistry.instance;
  }

  /**
   * Declare a new Extension Point.
   */
  public declareExtensionPoint(descriptor: ExtensionPointDescriptor): void {
    if (this.points.has(descriptor.id)) {
      console.warn(`[ExtensionRegistry] Extension point "${descriptor.id}" already declared.`);
      return;
    }
    this.points.set(descriptor.id, descriptor);
    if (!this.extensions.has(descriptor.id)) {
      this.extensions.set(descriptor.id, []);
    }
    console.log(`[ExtensionRegistry] Declared extension point: ${descriptor.id}`);
  }

  /**
   * Register an Extension implementing an Extension Point.
   */
  public registerExtension(descriptor: ExtensionDescriptor): void {
    if (!this.points.has(descriptor.pointId)) {
      throw new Error(`[ExtensionRegistry] Extension point "${descriptor.pointId}" is not declared.`);
    }

    const list = this.extensions.get(descriptor.pointId) || [];
    // Prevent duplicate registrations
    if (list.some((ext) => ext.extensionId === descriptor.extensionId)) {
      console.warn(`[ExtensionRegistry] Extension "${descriptor.extensionId}" already registered under "${descriptor.pointId}". Overwriting.`);
      this.extensions.set(descriptor.pointId, list.filter((ext) => ext.extensionId !== descriptor.extensionId));
    }

    this.extensions.get(descriptor.pointId)!.push({
      ...descriptor,
      priority: descriptor.priority ?? 100
    });

    // Sort by priority descending
    this.extensions.get(descriptor.pointId)!.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    console.log(`[ExtensionRegistry] Registered extension: ${descriptor.extensionId} -> ${descriptor.pointId}`);
  }

  /**
   * Unregister an Extension.
   */
  public unregisterExtension(pointId: string, extensionId: string): void {
    const list = this.extensions.get(pointId);
    if (list) {
      this.extensions.set(pointId, list.filter((ext) => ext.extensionId !== extensionId));
      console.log(`[ExtensionRegistry] Unregistered extension: ${extensionId} from ${pointId}`);
    }
  }

  /**
   * Retrieve all implementations for a given Extension Point.
   */
  public getExtensions<T = any>(pointId: string): T[] {
    const list = this.extensions.get(pointId) || [];
    return list.map((ext) => ext.implementation as T);
  }

  /**
   * Retrieve all Extension Descriptors for an Extension Point.
   */
  public getExtensionDescriptors<T = any>(pointId: string): ExtensionDescriptor<T>[] {
    return (this.extensions.get(pointId) || []) as ExtensionDescriptor<T>[];
  }

  /**
   * Get all declared Extension Points.
   */
  public getExtensionPoints(): ExtensionPointDescriptor[] {
    return Array.from(this.points.values());
  }

  /**
   * Clear all registries (for testing purposes).
   */
  public clear(): void {
    this.points.clear();
    this.extensions.clear();
  }
}

export const extensionRegistry = ExtensionRegistry.getInstance();
export default extensionRegistry;
