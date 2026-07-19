import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { Artifact, ArtifactType, ArtifactLifecycleState } from "@/types/artifact";
import { ProviderRegistry } from "../providers/registry";
import { LocalArtifactStorageProvider } from "../providers/local-artifact-storage";
import { centralConfig } from "../configuration/central-config";
import { filesystemWatcherService } from "../watcher/watcher-service";
// Side-effect import: ensures all providers are registered before first use
import "@/infrastructure/factories/provider-factory";

export class ArtifactRegistry {
  private static instance: ArtifactRegistry | null = null;
  private artifacts: Map<string, Artifact> = new Map();
  private metadataDb: Record<string, { tags?: string[]; relationships?: any[]; favorites?: boolean; description?: string }> = {};
  private registryFilePath: string = "";
  private lastScanTime: number = 0;

  private constructor() {
    // Start watching the artifacts directory in background
    setTimeout(() => {
      const rootDir = centralConfig.get<string>("artifacts.rootDir") || path.resolve(process.cwd(), "artifacts_storage");
      const normalizedRoot = path.resolve(rootDir).replace(/\\/g, "/");

      try {
        filesystemWatcherService.watchDirectory(normalizedRoot, async (event: any) => {
          console.log(`[ArtifactRegistry] Watcher event: ${event.type} for ${event.relativePath}`);

          // Re-sync registry
          await this.sync();

          const { eventBus } = require("../events/event-bus");
          const crypto = require("crypto");
          const artifactId = "art-" + crypto.createHash("md5").update(event.relativePath).digest("hex");

          let eventName = "";
          let priority: "low" | "medium" | "high" | "critical" = "medium";
          let payload: any = { artifactId, relativePath: event.relativePath };

          switch (event.type) {
            case "create":
              eventName = "ArtifactCreated";
              payload.artifact = this.getById(artifactId);
              
              // Trigger PreviewGenerated and ThumbnailGenerated
              setTimeout(() => {
                eventBus.publish({
                  name: "PreviewGenerated",
                  source: "artifact-registry",
                  version: "v1",
                  priority: "low",
                  securityClassification: "internal",
                  retentionPolicy: "archive",
                  payload: { artifactId, status: "ready" }
                });

                if (event.relativePath.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
                  eventBus.publish({
                    name: "ThumbnailGenerated",
                    source: "artifact-registry",
                    version: "v1",
                    priority: "low",
                    securityClassification: "internal",
                    retentionPolicy: "archive",
                    payload: { artifactId, thumbnailUri: `/api/v1/artifacts/${artifactId}/thumbnail` }
                  });
                }
              }, 100);
              break;
            case "update":
              eventName = "ArtifactUpdated";
              payload.artifact = this.getById(artifactId);
              break;
            case "delete":
              eventName = "ArtifactDeleted";
              break;
            case "rename":
              eventName = "ArtifactRenamed";
              payload.oldRelativePath = event.oldRelativePath;
              payload.artifact = this.getById(artifactId);
              break;
            case "move":
              eventName = "ArtifactMoved";
              payload.oldRelativePath = event.oldRelativePath;
              payload.artifact = this.getById(artifactId);
              break;
          }

          if (eventName) {
            eventBus.publish({
              name: eventName,
              source: "artifact-registry",
              version: "v1",
              priority,
              securityClassification: "internal",
              retentionPolicy: "archive",
              payload
            });

            // Trigger IndexUpdated
            eventBus.publish({
              name: "IndexUpdated",
              source: "artifact-registry",
              version: "v1",
              priority: "low",
              securityClassification: "internal",
              retentionPolicy: "archive",
              payload: { artifactId, status: "indexed" }
            });
          }
        });
      } catch (err) {
        console.error("[ArtifactRegistry] Failed to initialize watcher:", err);
      }
    }, 1000);
  }

  public static getInstance(): ArtifactRegistry {
    if (!ArtifactRegistry.instance) {
      ArtifactRegistry.instance = new ArtifactRegistry();
    }
    return ArtifactRegistry.instance;
  }

  private getProvider(): LocalArtifactStorageProvider | null {
    const providers = ProviderRegistry.getInstance().getProvidersByType<LocalArtifactStorageProvider>("artifact-provider");
    return providers.length > 0 ? providers[0] : null;
  }

  private loadMetadataDb() {
    const rootDir = centralConfig.get<string>("artifacts.rootDir");
    if (!rootDir) return;

    this.registryFilePath = path.join(rootDir, ".artifacts_registry.json");
    try {
      if (fs.existsSync(this.registryFilePath)) {
        const raw = fs.readFileSync(this.registryFilePath, "utf-8");
        this.metadataDb = JSON.parse(raw);
      } else {
        this.metadataDb = {};
      }
    } catch (err) {
      console.error("[ArtifactRegistry] Error loading metadata database:", err);
      this.metadataDb = {};
    }
  }

  private saveMetadataDb() {
    if (!this.registryFilePath) return;
    try {
      fs.writeFileSync(this.registryFilePath, JSON.stringify(this.metadataDb, null, 2), "utf-8");
    } catch (err) {
      console.error("[ArtifactRegistry] Error saving metadata database:", err);
    }
  }

  // Determine ArtifactType based on file extension
  private mapExtensionToType(ext: string): ArtifactType {
    const map: Record<string, ArtifactType> = {
      docx: "word",
      doc: "word",
      xlsx: "excel",
      xls: "excel",
      pptx: "powerpoint",
      ppt: "powerpoint",
      pdf: "pdf",
      md: "markdown",
      png: "image",
      jpg: "image",
      jpeg: "image",
      gif: "image",
      csv: "csv",
      json: "json",
      yaml: "yaml",
      yml: "yaml",
      html: "html",
      htm: "html",
      mermaid: "mermaid",
      mmd: "mermaid",
      svg: "svg",
      zip: "zip",
      rar: "zip",
      tar: "zip",
      gz: "zip",
      txt: "text",
      log: "text",
      js: "text",
      ts: "text",
      tsx: "text",
      py: "text"
    };
    return map[ext.replace(".", "").toLowerCase()] || "unknown";
  }

  private getMimeType(type: ArtifactType): string {
    const mimeTypes: Record<ArtifactType, string> = {
      word: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      powerpoint: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      pdf: "application/pdf",
      markdown: "text/markdown",
      image: "image/png",
      csv: "text/csv",
      json: "application/json",
      yaml: "application/x-yaml",
      html: "text/html",
      mermaid: "text/vnd.mermaid",
      svg: "image/svg+xml",
      zip: "application/zip",
      text: "text/plain",
      unknown: "application/octet-stream",
    };
    return mimeTypes[type] || mimeTypes.unknown;
  }

  private getIcon(type: ArtifactType): string {
    const icons: Record<ArtifactType, string> = {
      word: "file-text",
      excel: "file-spreadsheet",
      powerpoint: "presentation",
      pdf: "file-type",
      markdown: "file-edit",
      image: "file-image",
      csv: "file-spreadsheet",
      json: "file-code",
      yaml: "file-code",
      html: "file-code",
      mermaid: "git-branch",
      svg: "file-image",
      zip: "file-archive",
      text: "file-text",
      unknown: "file"
    };
    return icons[type] || icons.unknown;
  }

  // Incremental filesystem sync
  public async sync(): Promise<void> {
    const provider = this.getProvider();
    if (!provider) {
      console.warn("[ArtifactRegistry] LocalArtifactStorageProvider not registered. Skipping filesystem sync.");
      return;
    }

    this.loadMetadataDb();

    const files = await provider.scan();
    const currentKeys = new Set<string>();

    for (const file of files) {
      // Deterministic ID based on relative path MD5
      const id = "art-" + crypto.createHash("md5").update(file.relativePath).digest("hex");
      currentKeys.add(id);

      const ext = path.extname(file.relativePath).replace(".", "").toLowerCase();
      const type = this.mapExtensionToType(ext);
      const mimeType = this.getMimeType(type);
      const storageUri = `file:///${file.absolutePath}`;

      // Auto-extract tags based on folder folders
      const pathParts = file.relativePath.split("/").slice(0, -1);
      const autoTags = pathParts.filter(p => p && p !== "." && p !== "..");
      if (ext) {
        autoTags.push(ext);
      }

      // Merge with persistent metadata db
      const metaRecord = this.metadataDb[file.relativePath] || {};
      const mergedTags = Array.from(new Set([...autoTags, ...(metaRecord.tags || [])]));
      const relationships = metaRecord.relationships || [];
      const isFavorite = !!metaRecord.favorites;
      const customDescription = metaRecord.description || `Generated artifact file: ${path.basename(file.relativePath)}`;

      const isPreviewable = [
        "pdf", "markdown", "image", "csv", "json", "yaml", "html", "mermaid", "svg", "text"
      ].includes(type);

      const artifact: Artifact = {
        id,
        name: path.basename(file.relativePath),
        description: customDescription,
        type,
        mimeType,
        size: file.stats.size,
        createdDate: file.stats.birthtime.toISOString(),
        modifiedDate: file.stats.mtime.toISOString(),
        createdBy: "system",
        tags: mergedTags,
        status: "active",
        lifecycleState: "available",
        storage: {
          provider: "local",
          uri: storageUri,
          checksum: {
            algorithm: "sha256",
            value: "sha256-placeholder"
          }
        },
        relationships,
        preview: {
          isAvailable: isPreviewable,
          status: isPreviewable ? "ready" : "unsupported"
        },
        processing: {
          phase: "completed",
          progressPercentage: 100,
          completedAt: file.stats.mtime.toISOString()
        },
        search: {
          isIndexed: true,
          vectorStatus: "unindexed"
        },
        previewSupported: isPreviewable,
        downloadSupported: true,
        deleteSupported: true,
        version: "1.0",
        conversationId: metaRecord.relationships?.find(r => r.type === "conversation")?.targetId || "",
        workflowId: metaRecord.relationships?.find(r => r.type === "workflow")?.targetId || "",
        metadata: {
          relativePath: file.relativePath,
          isFavorite,
          icon: this.getIcon(type),
          checksum: "sha256-placeholder"
        }
      };

      this.artifacts.set(id, artifact);
    }

    // Identify and remove deleted files from active registry
    for (const [id, art] of this.artifacts.entries()) {
      if (!currentKeys.has(id)) {
        this.artifacts.delete(id);
      }
    }

    this.lastScanTime = Date.now();
  }

  // API query interface: search, filter, sort, paginate
  public async query(options: {
    search?: string;
    type?: string;
    tag?: string;
    lifecycleState?: string;
    sortField?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
    folder?: string;
  }): Promise<{ items: Artifact[]; total: number }> {
    // Only resync if 10 seconds elapsed, to prevent heavy scans on rapid paging
    if (Date.now() - this.lastScanTime > 10000) {
      await this.sync();
    }

    let items = Array.from(this.artifacts.values());

    // Search filter
    if (options.search) {
      const q = options.search.toLowerCase();
      items = items.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (options.type && options.type !== "all") {
      items = items.filter(item => item.type === options.type);
    }

    // Tag filter
    if (options.tag) {
      items = items.filter(item => item.tags.includes(options.tag!));
    }

    // Lifecycle State filter
    if (options.lifecycleState) {
      items = items.filter(item => item.lifecycleState === options.lifecycleState);
    }

    // Folder navigation filter
    if (options.folder !== undefined) {
      items = items.filter(item => {
        const rel = item.metadata.relativePath;
        const dir = path.dirname(rel).replace(/\\/g, "/");
        const matchDir = options.folder === "" || options.folder === "." ? "." : options.folder;
        return dir === matchDir;
      });
    }

    // Sorting
    const sortField = options.sortField || "createdDate";
    const sortOrder = options.sortOrder || "desc";

    items.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle sub-fields
      if (sortField.startsWith("metadata.")) {
        const field = sortField.replace("metadata.", "");
        valA = a.metadata[field];
        valB = b.metadata[field];
      }

      if (valA === undefined) return 1;
      if (valB === undefined) return -1;

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    const total = items.length;

    // Pagination
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    items = items.slice(offset, offset + limit);

    return { items, total };
  }

  public getById(id: string): Artifact | null {
    return this.artifacts.get(id) || null;
  }

  public registerCustomMetadata(id: string, metadata: { tags?: string[]; description?: string; favorites?: boolean; relationships?: any[] }): boolean {
    const art = this.artifacts.get(id);
    if (!art) return false;

    const relPath = art.metadata.relativePath;
    this.metadataDb[relPath] = {
      ...this.metadataDb[relPath],
      ...metadata
    };
    this.saveMetadataDb();

    // Apply immediately to cached item
    if (metadata.tags) art.tags = Array.from(new Set([...art.tags, ...metadata.tags]));
    if (metadata.description) art.description = metadata.description;
    if (metadata.favorites !== undefined) art.metadata.isFavorite = metadata.favorites;
    if (metadata.relationships) art.relationships = metadata.relationships;

    // Publish MetadataUpdated canonical event
    try {
      const { eventBus } = require("../events/event-bus");
      eventBus.publish({
        name: "MetadataUpdated",
        source: "artifact-registry",
        version: "v1",
        priority: "normal",
        securityClassification: "internal",
        retentionPolicy: "archive",
        payload: { artifactId: id, metadata }
      });
    } catch (e) {
      console.error("[ArtifactRegistry] Failed to publish MetadataUpdated event:", e);
    }

    return true;
  }
}
export const artifactRegistry = ArtifactRegistry.getInstance();
