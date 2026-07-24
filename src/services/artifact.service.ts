import { Artifact, ArtifactFilter, ArtifactType } from "@/types/artifact";
import { IHttpClient } from "@/infrastructure/contracts/http-client";
import { HttpClientFactory } from "@/infrastructure/factories/http-client-factory";

export class ArtifactService {
  constructor(private http: IHttpClient = HttpClientFactory.getDefaultClient()) {}

  async getAll(filter?: ArtifactFilter & { sortField?: string; sortOrder?: string; limit?: number; offset?: number; folder?: string }): Promise<Artifact[]> {
    try {
      const queryParams: Record<string, string | number | boolean> = {};
      if (filter) {
        if (filter.search) queryParams.search = filter.search;
        if (filter.type && filter.type !== "all" as any) queryParams.type = filter.type;
        if (filter.lifecycleState) queryParams.lifecycleState = filter.lifecycleState;
        if (filter.sortField) queryParams.sortField = filter.sortField;
        if (filter.sortOrder) queryParams.sortOrder = filter.sortOrder;
        if (filter.limit !== undefined) queryParams.limit = filter.limit;
        if (filter.offset !== undefined) queryParams.offset = filter.offset;
        if (filter.folder !== undefined) queryParams.folder = filter.folder;
        if (filter.tags && filter.tags.length > 0) {
          queryParams.tag = filter.tags[0];
        }
      }

      const res = await this.http.get<any>("/api/v1/artifacts", { params: queryParams });
      if (!res.ok) {
        throw new Error(`Failed to fetch artifacts: ${res.statusText}`);
      }
      return res.data?.items || [];
    } catch (err) {
      console.error("[ArtifactService] getAll error:", err);
      return [];
    }
  }

  async getById(id: string): Promise<Artifact | null> {
    try {
      const res = await this.http.get<Artifact>(`/api/v1/artifacts/${id}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch artifact ${id}: ${res.statusText}`);
      }
      return res.data;
    } catch (err) {
      console.error("[ArtifactService] getById error:", err);
      return null;
    }
  }

  async getPreview(id: string): Promise<any> {
    try {
      const res = await this.http.get<any>(`/api/v1/artifacts/${id}/preview`);
      if (!res.ok) {
        throw new Error(`Failed to fetch preview for ${id}: ${res.statusText}`);
      }
      return res.data;
    } catch (err) {
      console.error("[ArtifactService] getPreview error:", err);
      return { previewSupported: false, error: "Failed to load preview content." };
    }
  }

  async getMetadata(id: string): Promise<any> {
    try {
      const res = await this.http.get<any>(`/api/v1/artifacts/${id}/metadata`);
      if (!res.ok) {
        throw new Error(`Failed to fetch metadata for ${id}: ${res.statusText}`);
      }
      return res.data;
    } catch (err) {
      console.error("[ArtifactService] getMetadata error:", err);
      return {};
    }
  }

  async createArtifact(artifact: { name: string; type: string; description?: string; content?: string; tags?: string[]; conversationId?: string; workflowId?: string }): Promise<Artifact> {
    const res = await this.http.post<Artifact>("/api/v1/artifacts", artifact);
    if (!res.ok) {
      throw new Error(`Failed to create artifact: ${res.statusText}`);
    }
    return res.data;
  }

  async updateArtifact(id: string, updates: { tags?: string[]; description?: string; favorites?: boolean; relationships?: any[] }): Promise<Artifact | null> {
    try {
      const res = await this.http.patch<Artifact>(`/api/v1/artifacts/${id}`, updates);
      if (!res.ok) {
        throw new Error(`Failed to update artifact ${id}: ${res.statusText}`);
      }
      return res.data;
    } catch (err) {
      console.error("[ArtifactService] updateArtifact error:", err);
      return null;
    }
  }

  async deleteArtifact(id: string): Promise<boolean> {
    try {
      const res = await this.http.delete(`/api/v1/artifacts/${id}`);
      return res.ok;
    } catch (err) {
      console.error("[ArtifactService] deleteArtifact error:", err);
      return false;
    }
  }

  // Business Utilities
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  getArtifactMimeType(type: ArtifactType): string {
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

  isPreviewable(type: ArtifactType): boolean {
    const previewableTypes: ArtifactType[] = [
      "pdf",
      "markdown",
      "image",
      "csv",
      "json",
      "yaml",
      "html",
      "mermaid",
      "svg",
      "text",
    ];
    return previewableTypes.includes(type);
  }

  async triggerDownload(artifact: Artifact): Promise<boolean> {
    if (typeof window !== "undefined") {
      window.open(`/api/v1/artifacts/${artifact.id}/download`, "_blank");
      return true;
    }
    return false;
  }
}

export const artifactService = new ArtifactService();
