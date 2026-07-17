// src/platform/control-plane/PlatformPluginFramework.ts
import { PlatformComponent, LifecycleState } from './types';
import { platformOperationsControlPlane } from './PlatformOperationsControlPlane';
import { platformDigitalTwin } from './PlatformDigitalTwin';
import { eventPlatform } from '../event-bus/EventPlatform';

export interface PluginManifest {
  name: string;
  version: string;
  requiredAegisVersion: string;
  category: PlatformComponent['category'];
  dependencies: string[];
  capabilities: string[];
  permissions: string[];
  ownerModule?: string;
  onLoad?: () => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
  onStart?: () => void | Promise<void>;
  onStop?: () => void | Promise<void>;
}

export class PlatformPluginFramework {
  private static instance: PlatformPluginFramework | null = null;
  private plugins: Map<string, PluginManifest> = new Map();
  private pluginComponentIds: Map<string, string> = new Map(); // name -> registered component ID

  private constructor() {}

  public static getInstance(): PlatformPluginFramework {
    if (!PlatformPluginFramework.instance) {
      PlatformPluginFramework.instance = new PlatformPluginFramework();
    }
    return PlatformPluginFramework.instance;
  }

  public getPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Validates version compatibility and registers a dynamic plugin component.
   */
  public async loadPlugin(manifest: PluginManifest): Promise<boolean> {
    // 1. Version Negotiation (Target version check)
    const hostVersion = '1.0.0'; // Default AegisOS kernel version
    if (manifest.requiredAegisVersion !== '*' && manifest.requiredAegisVersion !== hostVersion) {
      console.warn(`[PluginFramework] Version conflict loading plugin "${manifest.name}". Required: ${manifest.requiredAegisVersion}, Host: ${hostVersion}`);
      return false;
    }

    // 2. Dependency Resolution
    for (const dep of manifest.dependencies) {
      const active = platformDigitalTwin.getComponent(dep);
      if (!active) {
        console.warn(`[PluginFramework] Unsatisfied dependency "${dep}" for plugin "${manifest.name}"`);
        return false;
      }
    }

    // 3. Capabilities negotiation
    if (manifest.capabilities.includes('cuda') && !platformDigitalTwin.getComponent('infra:gpu')) {
      console.warn(`[PluginFramework] Capability conflict: plugin "${manifest.name}" requires CUDA GPU acceleration.`);
      return false;
    }

    // 4. Load hook
    if (manifest.onLoad) {
      try {
        await manifest.onLoad();
      } catch (err: any) {
        console.error(`[PluginFramework] Error in onLoad hook for "${manifest.name}":`, err.message);
        return false;
      }
    }

    // 5. Dynamic register
    const compId = platformOperationsControlPlane.registerPlatformComponent({
      name: manifest.name,
      category: manifest.category,
      dependencies: manifest.dependencies,
      capabilities: manifest.capabilities,
      ownerModule: manifest.ownerModule || 'plugin',
      metadata: {
        version: manifest.version,
        permissions: manifest.permissions,
        marketplaceCertified: true
      },
      commands: {
        start: async () => {
          if (manifest.onStart) await manifest.onStart();
        },
        stop: async () => {
          if (manifest.onStop) await manifest.onStop();
        }
      }
    });

    this.plugins.set(manifest.name, manifest);
    this.pluginComponentIds.set(manifest.name, compId);

    console.log(`[PluginFramework] Plugin "${manifest.name}" successfully loaded and registered as component "${compId}"`);
    return true;
  }

  /**
   * Safely unloads a plugin and triggers lifecycle hooks.
   */
  public async unloadPlugin(name: string): Promise<boolean> {
    const manifest = this.plugins.get(name);
    const compId = this.pluginComponentIds.get(name);
    if (!manifest || !compId) return false;

    // Stop execution if running
    if (manifest.onStop) {
      try {
        await manifest.onStop();
      } catch {}
    }

    // Unload hook
    if (manifest.onUnload) {
      try {
        await manifest.onUnload();
      } catch {}
    }

    // Deregister from Control Plane
    const twin = platformDigitalTwin;
    (twin as any).cache.delete(compId);

    this.plugins.delete(name);
    this.pluginComponentIds.delete(name);

    await eventPlatform.publish({
      name: 'ComponentRemoved',
      source: 'plugin-framework',
      payload: { componentId: compId, name }
    });

    console.log(`[PluginFramework] Plugin "${name}" successfully unloaded.`);
    return true;
  }

  public async hotReloadPlugin(manifest: PluginManifest): Promise<boolean> {
    console.log(`[PluginFramework] Hot reloading plugin: ${manifest.name}`);
    await this.unloadPlugin(manifest.name);
    return this.loadPlugin(manifest);
  }
}
export const platformPluginFramework = PlatformPluginFramework.getInstance();
export default platformPluginFramework;
