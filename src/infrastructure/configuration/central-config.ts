import * as fs from "fs";
import * as path from "path";
import { IConfigurationProvider } from "./provider";

export class CentralConfiguration implements IConfigurationProvider {
  private configPath: string;
  private config: Record<string, any> = {};

  constructor() {
    if (typeof window !== "undefined") {
      this.configPath = "";
      this.config = {
        artifacts: {
          rootDir: "./artifacts_storage",
          ignoredFolders: ["node_modules", ".git", ".next", "cache", "tmp", "temp", "dist"],
          ignoredExtensions: [".exe", ".dll", ".log", ".pyc"],
          maxPreviewSize: 10485760,
          maxUploadSize: 52428800,
          supportedPreviewProviders: [
            "markdown", "pdf", "image", "json", "yaml", "csv", "html", "text", "mermaid", "svg", "code", "word", "excel", "powerpoint", "zip", "unknown"
          ]
        }
      };
      return;
    }
    this.configPath = process.env.OPS_CONFIG_PATH || path.resolve(process.cwd(), "console_config.json");
    this.load();
  }

  private load() {
    const defaultRootDir = process.env.OPS_ARTIFACTS_DIR || path.resolve(process.cwd(), "artifacts_storage");
    const defaults = {
      artifacts: {
        rootDir: defaultRootDir.replace(/\\/g, "/"),
        ignoredFolders: ["node_modules", ".git", ".next", "cache", "tmp", "temp", "dist"],
        ignoredExtensions: [".exe", ".dll", ".log", ".pyc"],
        maxPreviewSize: 10 * 1024 * 1024, // 10MB
        maxUploadSize: 50 * 1024 * 1024, // 50MB
        supportedPreviewProviders: [
          "markdown",
          "pdf",
          "image",
          "json",
          "yaml",
          "csv",
          "html",
          "text",
          "mermaid",
          "svg",
          "code",
          "word",
          "excel",
          "powerpoint",
          "zip",
          "unknown"
        ]
      }
    };

    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, "utf-8");
        const loaded = JSON.parse(raw);
        this.config = {
          ...defaults,
          ...loaded,
          artifacts: {
            ...defaults.artifacts,
            ...(loaded.artifacts || {})
          }
        };
      } else {
        this.config = defaults;
        this.save();
      }
    } catch (err) {
      console.error("[CentralConfiguration] Error loading config, using defaults:", err);
      this.config = defaults;
    }

    // Ensure root directory exists
    const rootDir = this.config.artifacts?.rootDir;
    if (rootDir && !fs.existsSync(rootDir)) {
      try {
        fs.mkdirSync(rootDir, { recursive: true });
        console.log(`[CentralConfiguration] Created configured artifacts root dir: ${rootDir}`);
      } catch (err) {
        console.error(`[CentralConfiguration] Failed to create artifacts root dir: ${rootDir}`, err);
      }
    }
  }

  public save() {
    if (typeof window !== "undefined") return;
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), "utf-8");
    } catch (err) {
      console.error("[CentralConfiguration] Error saving config:", err);
    }
  }

  get<T>(key: string, defaultValue?: T): T {
    const parts = key.split(".");
    let current = this.config;
    for (const part of parts) {
      if (current === undefined || current === null) {
        return defaultValue as T;
      }
      current = current[part];
    }
    return current !== undefined ? (current as T) : (defaultValue as T);
  }

  has(key: string): boolean {
    const parts = key.split(".");
    let current = this.config;
    for (const part of parts) {
      if (current === undefined || current === null || !(part in current)) {
        return false;
      }
      current = current[part];
    }
    return true;
  }

  set<T>(key: string, value: T): void {
    const parts = key.split(".");
    let current = this.config;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
    this.save();
    
    // Ensure root directory exists if updated
    if (typeof window === "undefined" && key === "artifacts.rootDir" && typeof value === "string") {
      if (!fs.existsSync(value)) {
        try {
          fs.mkdirSync(value, { recursive: true });
          console.log(`[CentralConfiguration] Created new configured artifacts root dir: ${value}`);
        } catch (err) {
          console.error(`[CentralConfiguration] Failed to create new artifacts root dir: ${value}`, err);
        }
      }
    }
  }

  getProviderConfig(providerId: string): Record<string, any> {
    if (providerId === "local-artifact-storage-provider") {
      return this.config.artifacts || {};
    }
    return this.config[providerId.replace("-provider", "")] || {};
  }

  getAllConfig(): Record<string, any> {
    return this.config;
  }
}

export const centralConfig = new CentralConfiguration();
export default centralConfig;
