import { Artifact, ArtifactFilter, ArtifactType } from "@/types/artifact";

export class ArtifactService {
  async getAll(filter?: ArtifactFilter & { sortField?: string; sortOrder?: string; limit?: number; offset?: number; folder?: string }): Promise<Artifact[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filter) {
        if (filter.search) queryParams.append("search", filter.search);
        if (filter.type && filter.type !== "all" as any) queryParams.append("type", filter.type);
        if (filter.lifecycleState) queryParams.append("lifecycleState", filter.lifecycleState);
        if (filter.sortField) queryParams.append("sortField", filter.sortField);
        if (filter.sortOrder) queryParams.append("sortOrder", filter.sortOrder);
        if (filter.limit !== undefined) queryParams.append("limit", filter.limit.toString());
        if (filter.offset !== undefined) queryParams.append("offset", filter.offset.toString());
        if (filter.folder !== undefined) queryParams.append("folder", filter.folder);
        if (filter.tags && filter.tags.length > 0) {
          // Append the first tag or tag filter
          queryParams.append("tag", filter.tags[0]);
        }
      }

      const res = await fetch(`/api/v1/artifacts?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch artifacts: ${res.statusText}`);
      }
      const data = await res.json();
      return data.items || [];
    } catch (err) {
      console.error("[ArtifactService] getAll error:", err);
      return [];
    }
  }

  async getById(id: string): Promise<Artifact | null> {
    try {
      const res = await fetch(`/api/v1/artifacts/${id}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch artifact ${id}: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.error("[ArtifactService] getById error:", err);
      return null;
    }
  }

  async getPreview(id: string): Promise<any> {
    try {
      const res = await fetch(`/api/v1/artifacts/${id}/preview`);
      if (!res.ok) {
        throw new Error(`Failed to fetch preview for ${id}: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.error("[ArtifactService] getPreview error:", err);
      return { previewSupported: false, error: "Failed to load preview content." };
    }
  }

  async getMetadata(id: string): Promise<any> {
    try {
      const res = await fetch(`/api/v1/artifacts/${id}/metadata`);
      if (!res.ok) {
        throw new Error(`Failed to fetch metadata for ${id}: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.error("[ArtifactService] getMetadata error:", err);
      return {};
    }
  }

  async createArtifact(artifact: { name: string; type: string; description?: string; content?: string; tags?: string[]; conversationId?: string; workflowId?: string }): Promise<Artifact> {
    const res = await fetch("/api/v1/artifacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(artifact)
    });
    if (!res.ok) {
      throw new Error(`Failed to create artifact: ${res.statusText}`);
    }
    return await res.json();
  }

  async updateArtifact(id: string, updates: { tags?: string[]; description?: string; favorites?: boolean; relationships?: any[] }): Promise<Artifact | null> {
    try {
      const res = await fetch(`/api/v1/artifacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        throw new Error(`Failed to update artifact ${id}: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.error("[ArtifactService] updateArtifact error:", err);
      return null;
    }
  }

  async deleteArtifact(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/v1/artifacts/${id}`, {
        method: "DELETE"
      });
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
