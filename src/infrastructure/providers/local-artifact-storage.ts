import * as fs from "fs";
import * as path from "path";
import { IArtifactProviderAdapter } from "../contracts/artifact";
import { HealthCheckResult } from "../health/types";
import { CapabilityReport } from "../discovery/types";
import { centralConfig } from "../configuration/central-config";

export class LocalArtifactStorageProvider implements IArtifactProviderAdapter {
  id = "local-artifact-storage-provider";
  name = "Local Artifact Storage Provider";
  type = "artifact-provider" as const;
  private rootDir: string = "";
  private initialized: boolean = false;

  async initialize(config: Record<string, any>): Promise<void> {
    // Read from central configuration or fall back to initialized config
    this.rootDir = centralConfig.get<string>("artifacts.rootDir") || config.rootDir || path.resolve(process.cwd(), "artifacts_storage");
    this.rootDir = path.resolve(this.rootDir).replace(/\\/g, "/");

    if (!fs.existsSync(this.rootDir)) {
      fs.mkdirSync(this.rootDir, { recursive: true });
    }

    this.initialized = true;
    console.log(`[LocalArtifactStorageProvider] Initialized. Root Directory: ${this.rootDir}`);
  }

  async shutdown(): Promise<void> {
    console.log(`[LocalArtifactStorageProvider] Shut down.`);
  }

  async checkHealth(): Promise<HealthCheckResult> {
    try {
      if (!this.initialized) {
        return {
          status: "unhealthy",
          latencyMs: 0,
          lastCheckedAt: new Date().toISOString(),
          errorMessage: "Provider not initialized"
        };
      }

      fs.accessSync(this.rootDir, fs.constants.R_OK | fs.constants.W_OK);
      return {
        status: "healthy",
        latencyMs: 0.1,
        lastCheckedAt: new Date().toISOString(),
        version: "1.0.0",
        details: { rootDir: this.rootDir }
      };
    } catch (err: any) {
      return {
        status: "unhealthy",
        latencyMs: 0.1,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: err.message
      };
    }
  }

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: "1.0.0",
      capabilities: [
        { name: "artifact-storage", description: "Store and retrieve local artifacts" },
        { name: "filesystem-discovery", description: "Discover files recursively in configured root" }
      ],
      supportedOperations: ["save", "read", "delete", "exists", "scan"],
      limitations: ["Supports local file systems only"],
      dependencies: [],
      authRequirements: "none"
    };
  }

  // Resolve absolute path from storage URI or relative path
  private resolveAbsolutePath(uriOrPath: string): string {
    let cleanPath = uriOrPath;
    if (uriOrPath.startsWith("file:///")) {
      cleanPath = uriOrPath.replace("file:///", "");
    }
    // If it's already absolute and under rootDir, return it. Otherwise combine with rootDir.
    const resolved = path.isAbsolute(cleanPath)
      ? path.resolve(cleanPath)
      : path.resolve(this.rootDir, cleanPath);

    const normalizedResolved = resolved.replace(/\\/g, "/");
    
    // Safety check to prevent directory traversal attacks
    if (!normalizedResolved.startsWith(this.rootDir)) {
      throw new Error(`Directory traversal attempt detected: ${uriOrPath}`);
    }

    return normalizedResolved;
  }

  async save(key: string, data: Uint8Array, mimeType: string): Promise<string> {
    const targetPath = this.resolveAbsolutePath(key);
    const targetDir = path.dirname(targetPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(targetPath, Buffer.from(data));
    return `file:///${targetPath}`;
  }

  async read(uri: string): Promise<Uint8Array> {
    const targetPath = this.resolveAbsolutePath(uri);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`File does not exist: ${uri}`);
    }
    const data = fs.readFileSync(targetPath);
    return new Uint8Array(data);
  }

  async delete(uri: string): Promise<boolean> {
    const targetPath = this.resolveAbsolutePath(uri);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      return true;
    }
    return false;
  }

  async exists(uri: string): Promise<boolean> {
    try {
      const targetPath = this.resolveAbsolutePath(uri);
      return fs.existsSync(targetPath);
    } catch {
      return false;
    }
  }

  // Filesystem Discovery recursive method
  async scan(): Promise<Array<{ relativePath: string; absolutePath: string; stats: fs.Stats }>> {
    if (!this.initialized) {
      await this.initialize({});
    }

    const ignoredFolders = centralConfig.get<string[]>("artifacts.ignoredFolders") || [];
    const ignoredExtensions = centralConfig.get<string[]>("artifacts.ignoredExtensions") || [];
    const results: Array<{ relativePath: string; absolutePath: string; stats: fs.Stats }> = [];

    const traverse = async (currentDir: string) => {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name).replace(/\\/g, "/");
        
        // 1. Ignore hidden files/folders (starting with .)
        if (entry.name.startsWith(".")) {
          continue;
        }

        if (entry.isDirectory()) {
          // 2. Ignore system and cache folders as configured
          if (ignoredFolders.some(folder => folder.toLowerCase() === entry.name.toLowerCase())) {
            continue;
          }
          await traverse(fullPath);
        } else if (entry.isFile()) {
          // 3. Ignore ignored extensions
          const ext = path.extname(entry.name).toLowerCase();
          if (ignoredExtensions.some(ignoredExt => ignoredExt.toLowerCase() === ext)) {
            continue;
          }

          const relativePath = path.relative(this.rootDir, fullPath).replace(/\\/g, "/");
          const stats = await fs.promises.stat(fullPath);

          results.push({
            relativePath,
            absolutePath: fullPath,
            stats
          });
        }
      }
    };

    try {
      await traverse(this.rootDir);
    } catch (err) {
      console.error("[LocalArtifactStorageProvider] Scan error:", err);
    }

    return results;
  }

  // Future watch hook skeleton for event-driven updates
  onFileEvent(callback: (event: "create" | "update" | "delete", relativePath: string) => void): void {
    console.log("[LocalArtifactStorageProvider] Registered watcher callback for future event-driven updates.");
  }
}
export default LocalArtifactStorageProvider;
