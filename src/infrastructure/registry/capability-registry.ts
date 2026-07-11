import * as fs from "fs";
import * as path from "path";

export interface CapabilityPluginManifest {
  id: string;
  name: string;
  version: string;
  manifestVersion: string;
  capabilities: string[];
  dependencies: Record<string, string>;
  configSchema: any;
  permissions: string[];
  lifecycleHooks?: {
    onInitialize?: string;
    onShutdown?: string;
  };
}

export class CapabilityRegistry {
  private static instance: CapabilityRegistry | null = null;
  private plugins: Map<string, CapabilityPluginManifest> = new Map();
  private manifestDir: string;

  private constructor() {
    this.manifestDir = path.resolve(process.cwd(), "configs", "plugins");
    this.ensureDirs();
    this.seedDefaultManifests();
  }

  public static getInstance(): CapabilityRegistry {
    if (!CapabilityRegistry.instance) {
      CapabilityRegistry.instance = new CapabilityRegistry();
    }
    return CapabilityRegistry.instance;
  }

  private ensureDirs() {
    if (!fs.existsSync(this.manifestDir)) {
      fs.mkdirSync(this.manifestDir, { recursive: true });
    }
  }

  private seedDefaultManifests() {
    // Seed CodeGraph Plugin manifest
    const codeGraphManifest: CapabilityPluginManifest = {
      id: "codegraph-ast-plugin",
      name: "CodeGraph AST Engine",
      version: "1.2.0",
      manifestVersion: "1.0",
      capabilities: ["ast-indexing", "symbol-query"],
      dependencies: { platform: ">=1.0.0" },
      configSchema: {
        type: "object",
        properties: {
          indexTargetFolder: { type: "string", default: "./src" }
        }
      },
      permissions: ["file-read", "registry-write"]
    };

    this.registerPlugin(codeGraphManifest);
  }

  public registerPlugin(manifest: CapabilityPluginManifest): void {
    this.plugins.set(manifest.id, manifest);
    const targetPath = path.join(this.manifestDir, `${manifest.id}.json`);
    try {
      fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2), "utf-8");
      console.log(`[CapabilityRegistry] Registered discoverable plugin: ${manifest.name} (${manifest.id})`);
    } catch (err) {
      console.error(`[CapabilityRegistry] Failed to save manifest for ${manifest.id}:`, err);
    }
  }

  public getPlugin(id: string): CapabilityPluginManifest | null {
    return this.plugins.get(id) || null;
  }

  public listPlugins(): CapabilityPluginManifest[] {
    return Array.from(this.plugins.values());
  }

  public queryCapability(capabilityName: string): CapabilityPluginManifest[] {
    return this.listPlugins().filter((p) => p.capabilities.includes(capabilityName));
  }
}

export const capabilityRegistry = CapabilityRegistry.getInstance();
export default capabilityRegistry;
