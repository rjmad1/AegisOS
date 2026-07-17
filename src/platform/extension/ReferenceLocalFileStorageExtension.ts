// src/platform/extension/ReferenceLocalFileStorageExtension.ts
import { IStorageProviderPlugin, IPluginContext } from "../../api/types/plugins";
import * as fs from "fs/promises";
import * as path from "path";

export class ReferenceLocalFileStorageExtension implements IStorageProviderPlugin {
  id = "com.aegisos.extension.local-file-storage";
  name = "Local File Storage Reference Extension";
  version = "1.0.0";
  description = "A production-quality reference extension implementing local file storage.";
  author = "Enterprise Platform Team";
  type = "storage-provider" as const;
  scheme = "local";
  signature = "a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0"; // 64 chars

  private context: IPluginContext | null = null;
  private baseDir: string = "";

  async initialize(context: IPluginContext): Promise<void> {
    this.context = context;
    this.baseDir = context.config.storageDir || path.join(process.cwd(), "temp_reference_storage");
    
    // Ensure base directory exists
    await fs.mkdir(this.baseDir, { recursive: true });
    context.logger.info(`Reference Local File Storage Extension initialized. Base directory: ${this.baseDir}`);
  }

  async shutdown(): Promise<void> {
    if (this.context) {
      this.context.logger.info("Reference Local File Storage Extension shutting down.");
    }
  }

  private getFilePath(key: string): string {
    // Basic path traversal protection
    const sanitizedKey = path.normalize(key).replace(/^(\.\.(\/|\\))+/, "");
    return path.join(this.baseDir, sanitizedKey);
  }

  private getUri(key: string): string {
    return `${this.scheme}://${key}`;
  }

  private getPathFromUri(uri: string): string {
    if (!uri.startsWith(`${this.scheme}://`)) {
      throw new Error(`Invalid URI scheme: expected ${this.scheme}://`);
    }
    const key = uri.slice(`${this.scheme}://`.length);
    return this.getFilePath(key);
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    if (typeof stream.getReader === "function") {
      // Web ReadableStream
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      return Buffer.concat(chunks.map(c => Buffer.from(c)));
    } else {
      // Node Readable Stream
      return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on("data", (chunk: any) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", (err: any) => reject(err));
      });
    }
  }

  async save(key: string, data: Uint8Array | any, mimeType: string): Promise<string> {
    if (!this.context) throw new Error("Plugin not initialized");
    
    const filePath = this.getFilePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    let buffer: Buffer;
    if (data instanceof Uint8Array) {
      buffer = Buffer.from(data);
    } else {
      // Assume stream
      buffer = await this.streamToBuffer(data);
    }

    await fs.writeFile(filePath, buffer);
    this.context.logger.info(`Saved artifact to: ${filePath} (${mimeType})`);
    return this.getUri(key);
  }

  async read(uri: string): Promise<Uint8Array> {
    if (!this.context) throw new Error("Plugin not initialized");
    const filePath = this.getPathFromUri(uri);
    try {
      const data = await fs.readFile(filePath);
      return new Uint8Array(data);
    } catch (err: any) {
      this.context.logger.error(`Failed to read artifact from ${filePath}: ${err.message}`);
      throw err;
    }
  }

  async delete(uri: string): Promise<boolean> {
    if (!this.context) throw new Error("Plugin not initialized");
    const filePath = this.getPathFromUri(uri);
    try {
      await fs.unlink(filePath);
      this.context.logger.info(`Deleted artifact at: ${filePath}`);
      return true;
    } catch (err) {
      return false;
    }
  }

  async exists(uri: string): Promise<boolean> {
    if (!this.context) throw new Error("Plugin not initialized");
    const filePath = this.getPathFromUri(uri);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
