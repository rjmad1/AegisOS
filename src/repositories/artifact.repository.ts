// src/repositories/artifact.repository.ts
// Relational SQLite Persistence for Candidate Artifacts using Prisma ORM

import prisma from "../infrastructure/db/prisma";
import { Artifact, ArtifactFilter } from "@/types/artifact";

export interface IArtifactRepository {
  list(filter?: ArtifactFilter): Promise<Artifact[]>;
  getById(id: string): Promise<Artifact | null>;
  create(artifact: Omit<Artifact, "id" | "createdDate" | "modifiedDate">): Promise<Artifact>;
  update(id: string, updates: Partial<Artifact>): Promise<Artifact | null>;
  delete(id: string): Promise<boolean>;
}

export class SQLiteArtifactRepository implements IArtifactRepository {
  private async ensureSeed(): Promise<void> {
    const count = await prisma.artifact.count();
    if (count > 0) return;

    // Seed mock assets on first access
    const mockSeed: any[] = [
      {
        id: "art-01",
        name: "requirements_doc.docx",
        description: "Console architecture specification and requirements checklist.",
        type: "word",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 45200,
        createdDate: "2026-07-09T10:00:00Z",
        modifiedDate: "2026-07-09T11:30:00Z",
        createdBy: "admin",
        tags: ["documentation", "phase1"],
        status: "active",
        location: "/storage/artifacts/requirements_doc.docx",
        previewSupported: false,
        downloadSupported: true,
        deleteSupported: true,
        version: "1.2",
        conversationId: "conv-f22ace",
        workflowId: "wf-init-01",
        metadata: { wordCount: 1450, pages: 4 },
      },
      {
        id: "art-02",
        name: "hardware_costing.xlsx",
        description: "Cost assessment spreadsheet for workstation hardware enhancements.",
        type: "excel",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 112400,
        createdDate: "2026-07-09T09:15:00Z",
        modifiedDate: "2026-07-09T09:15:00Z",
        createdBy: "admin",
        tags: ["finance", "hardware"],
        status: "active",
        location: "/storage/artifacts/hardware_costing.xlsx",
        previewSupported: false,
        downloadSupported: true,
        deleteSupported: false,
        version: "1.0",
        conversationId: "conv-4b8756",
        workflowId: "wf-cost-02",
        metadata: { sheets: ["RTX_Comparison", "Procurement_Plan"], rows: 84 },
      },
      {
        id: "art-03",
        name: "system_architecture_diagram.pdf",
        description: "Workstation deployment topology diagram PDF export.",
        type: "pdf",
        mimeType: "application/pdf",
        size: 1540000,
        createdDate: "2026-07-09T08:00:00Z",
        modifiedDate: "2026-07-09T10:45:00Z",
        createdBy: "admin",
        tags: ["architecture", "diagram"],
        status: "active",
        location: "/storage/artifacts/system_architecture_diagram.pdf",
        previewSupported: true,
        downloadSupported: true,
        deleteSupported: true,
        version: "2.0",
        conversationId: "conv-9e93f7",
        workflowId: "wf-arch-03",
        metadata: { pdfPages: 1, isLocked: false },
      },
      {
        id: "art-04",
        name: "deployment_flow.md",
        description: "Detailed system instructions for manual production deployment.",
        type: "markdown",
        mimeType: "text/markdown",
        size: 8200,
        createdDate: "2026-07-09T12:00:00Z",
        modifiedDate: "2026-07-09T12:05:00Z",
        createdBy: "admin",
        tags: ["guides", "devops"],
        status: "active",
        location: "/storage/artifacts/deployment_flow.md",
        previewSupported: true,
        downloadSupported: true,
        deleteSupported: true,
        version: "1.0",
        conversationId: "conv-e77d27",
        workflowId: "wf-deploy-04",
        metadata: {
          content: `# Deployment Playbook\n\n1. Ensure local ports are free (4000, 18789)\n2. Compile typescript build\n3. Start console process using pm2 or nssm`
        },
      },
      {
        id: "art-05",
        name: "workstation_logo.png",
        description: "Branding graphic and system dashboard logo.",
        type: "image",
        mimeType: "image/png",
        size: 320000,
        createdDate: "2026-07-09T11:00:00Z",
        modifiedDate: "2026-07-09T11:00:00Z",
        createdBy: "admin",
        tags: ["design", "assets"],
        status: "active",
        location: "/storage/artifacts/workstation_logo.png",
        previewSupported: true,
        downloadSupported: true,
        deleteSupported: true,
        version: "1.0",
        conversationId: "conv-158db8",
        workflowId: "wf-design-05",
        metadata: { width: 512, height: 512, format: "PNG" },
      },
      {
        id: "art-06",
        name: "model_weights_catalog.csv",
        description: "CSV listing details on size and quantization level of served LLMs.",
        type: "csv",
        mimeType: "text/csv",
        size: 15400,
        createdDate: "2026-07-09T08:30:00Z",
        modifiedDate: "2026-07-09T08:30:00Z",
        createdBy: "admin",
        tags: ["models", "inventory"],
        status: "active",
        location: "/storage/artifacts/model_weights_catalog.csv",
        previewSupported: true,
        downloadSupported: true,
        deleteSupported: true,
        version: "1.1",
        conversationId: "conv-f22ace",
        workflowId: "wf-models-06",
        metadata: {
          headers: ["ModelName", "Parameters", "VRAM_Size", "Quantization"],
          content: "gemma4,9B,9.6GB,Q8_0\ndeepseek-r1,32B,19GB,IQ4_XS\nqwen2.5,14B,9.3GB,Q8_0"
        },
      },
      {
        id: "art-07",
        name: "service_config.json",
        description: "Operation settings for LiteLLM routing proxy chains.",
        type: "json",
        mimeType: "application/json",
        size: 4230,
        createdDate: "2026-07-09T14:00:00Z",
        modifiedDate: "2026-07-09T14:12:00Z",
        createdBy: "admin",
        tags: ["config", "litellm"],
        status: "active",
        location: "/storage/artifacts/service_config.json",
        previewSupported: true,
        downloadSupported: true,
        deleteSupported: true,
        version: "3.4",
        conversationId: "conv-e77d27",
        workflowId: "wf-routing-07",
        metadata: {
          content: JSON.stringify({
            routing_strategy: "least-busy",
            retries: 3,
            timeout: 120,
            telemetry: false,
            fallback_chains: ["gemma", "qwen", "smollm"]
          }, null, 2)
        },
      },
      {
        id: "art-08",
        name: "model_topology.mermaid",
        description: "Mermaid sequence flowchart mapping local route cascades.",
        type: "mermaid",
        mimeType: "text/vnd.mermaid",
        size: 1530,
        createdDate: "2026-07-09T13:00:00Z",
        modifiedDate: "2026-07-09T13:10:00Z",
        createdBy: "admin",
        tags: ["diagram", "routing"],
        status: "active",
        location: "/storage/artifacts/model_topology.mermaid",
        previewSupported: true,
        downloadSupported: true,
        deleteSupported: true,
        version: "1.0",
        conversationId: "conv-f22ace",
        workflowId: "wf-diagram-08",
        metadata: {
          content: `graph TD
  User([User Request]) --> LiteLLM{LiteLLM Proxy}
  LiteLLM -- healthy --> gemma[gemma4:latest]
  LiteLLM -- busy --> qwen[qwen2.5:14b]
  LiteLLM -- fail --> smollm[smollm:135m]`
        },
      },
      {
        id: "art-09",
        name: "backup_archive.zip",
        description: "Compressed backup of model database files.",
        type: "zip",
        mimeType: "application/zip",
        size: 124500000,
        createdDate: "2026-07-08T22:00:00Z",
        modifiedDate: "2026-07-08T22:00:00Z",
        createdBy: "admin",
        tags: ["backup", "database"],
        status: "active",
        location: "/storage/artifacts/backup_archive.zip",
        previewSupported: false,
        downloadSupported: true,
        deleteSupported: true,
        version: "1.0",
        conversationId: "conv-887663",
        workflowId: "wf-backup-09",
        metadata: { fileCount: 42, compressionRatio: "76%" },
      },
      {
        id: "art-10",
        name: "system_info.txt",
        description: "Plain text hardware printout from initial discovery scan.",
        type: "text",
        mimeType: "text/plain",
        size: 450,
        createdDate: "2026-07-09T14:10:00Z",
        modifiedDate: "2026-07-09T14:10:00Z",
        createdBy: "admin",
        tags: ["discovery", "hardware"],
        status: "active",
        location: "/storage/artifacts/system_info.txt",
        previewSupported: true,
        downloadSupported: true,
        deleteSupported: true,
        version: "1.0",
        conversationId: "conv-9e93f7",
        workflowId: "wf-disc-10",
        metadata: {
          content: `OS Name: Microsoft Windows 11 Pro\nProcessor: AMD Ryzen 9 9950X3D 16-Core Processor\nGPU: NVIDIA GeForce RTX 5080\nRAM: 64 GB DDR5`
        },
      }
    ];

    for (const item of mockSeed) {
      await prisma.artifact.create({
        data: {
          id: item.id,
          name: item.name,
          description: item.description,
          type: item.type,
          mimeType: item.mimeType,
          size: item.size,
          createdDate: item.createdDate,
          modifiedDate: item.modifiedDate,
          createdBy: item.createdBy,
          tags: JSON.stringify(item.tags),
          status: item.status,
          location: item.location,
          previewSupported: item.previewSupported,
          downloadSupported: item.downloadSupported,
          deleteSupported: item.deleteSupported,
          version: item.version,
          conversationId: item.conversationId,
          workflowId: item.workflowId,
          metadata: JSON.stringify(item.metadata),
          lifecycleState: "available",
          storage: JSON.stringify({ provider: "local", uri: item.location }),
          relationships: JSON.stringify([]),
          preview: JSON.stringify({ isAvailable: item.previewSupported, status: item.previewSupported ? "ready" : "unsupported" }),
          processing: JSON.stringify({ phase: "completed", progressPercentage: 100 }),
          search: JSON.stringify({ isIndexed: true, vectorStatus: "indexed" }),
        },
      });
    }
  }

  private parseRecord(r: any): Artifact {
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      type: r.type,
      mimeType: r.mimeType,
      size: r.size,
      createdDate: r.createdDate,
      modifiedDate: r.modifiedDate,
      createdBy: r.createdBy,
      tags: JSON.parse(r.tags),
      status: r.status as any,
      location: r.location,
      previewSupported: r.previewSupported,
      downloadSupported: r.downloadSupported,
      deleteSupported: r.deleteSupported,
      version: r.version,
      conversationId: r.conversationId,
      workflowId: r.workflowId,
      metadata: JSON.parse(r.metadata),
      lifecycleState: r.lifecycleState as any,
      storage: JSON.parse(r.storage),
      relationships: JSON.parse(r.relationships),
      preview: JSON.parse(r.preview),
      processing: JSON.parse(r.processing),
      search: JSON.parse(r.search),
    } as any;
  }

  async list(filter?: ArtifactFilter): Promise<Artifact[]> {
    await this.ensureSeed();

    const whereClause: any = { deletedAt: null };

    if (filter) {
      if (filter.type) {
        whereClause.type = filter.type;
      }
      if (filter.search) {
        const query = filter.search;
        whereClause.OR = [
          { name: { contains: query } },
          { description: { contains: query } },
        ];
      }
    }

    const records = await prisma.artifact.findMany({
      where: whereClause,
    });

    let result = records.map((r) => this.parseRecord(r));

    // Handle tag filtering in memory due to SQLite JSON array constraints
    if (filter && filter.tags && filter.tags.length > 0) {
      result = result.filter((item) =>
        filter.tags!.every((t) => item.tags.includes(t))
      );
    }

    return result;
  }

  async getById(id: string): Promise<Artifact | null> {
    await this.ensureSeed();
    const r = await prisma.artifact.findFirst({
      where: { id, deletedAt: null },
    });
    if (!r) return null;
    return this.parseRecord(r);
  }

  async create(artifact: Omit<Artifact, "id" | "createdDate" | "modifiedDate">): Promise<Artifact> {
    await this.ensureSeed();
    const id = `art-${Date.now()}`;
    const now = new Date().toISOString();
    const art = artifact as any;

    const record = await prisma.artifact.create({
      data: {
        id,
        name: art.name,
        description: art.description,
        type: art.type,
        mimeType: art.mimeType,
        size: art.size,
        createdDate: now,
        modifiedDate: now,
        createdBy: art.createdBy,
        tags: JSON.stringify(art.tags || []),
        status: art.status,
        location: art.location || "",
        previewSupported: art.previewSupported,
        downloadSupported: art.downloadSupported,
        deleteSupported: art.deleteSupported,
        version: art.version,
        conversationId: art.conversationId,
        workflowId: art.workflowId,
        metadata: JSON.stringify(art.metadata || {}),
        lifecycleState: "available",
        storage: JSON.stringify({ provider: "local", uri: art.location || "" }),
        relationships: JSON.stringify([]),
        preview: JSON.stringify({ isAvailable: art.previewSupported, status: art.previewSupported ? "ready" : "unsupported" }),
        processing: JSON.stringify({ phase: "completed", progressPercentage: 100 }),
        search: JSON.stringify({ isIndexed: true, vectorStatus: "indexed" }),
      },
    });

    return this.parseRecord(record);
  }

  async update(id: string, updates: Partial<Artifact>): Promise<Artifact | null> {
    await this.ensureSeed();
    const now = new Date().toISOString();

    const dataToUpdate: any = {
      modifiedDate: now,
    };

    if (updates.name !== undefined) dataToUpdate.name = updates.name;
    if (updates.description !== undefined) dataToUpdate.description = updates.description;
    if (updates.type !== undefined) dataToUpdate.type = updates.type;
    if (updates.mimeType !== undefined) dataToUpdate.mimeType = updates.mimeType;
    if (updates.size !== undefined) dataToUpdate.size = updates.size;
    if (updates.status !== undefined) dataToUpdate.status = updates.status;
    if (updates.tags !== undefined) dataToUpdate.tags = JSON.stringify(updates.tags);
    if (updates.metadata !== undefined) dataToUpdate.metadata = JSON.stringify(updates.metadata);

    const record = await prisma.artifact.update({
      where: { id },
      data: dataToUpdate,
    });

    if (!record) return null;
    return this.parseRecord(record);
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureSeed();
    try {
      await prisma.artifact.update({
        where: { id },
        data: {
          status: "deleted",
          deletedAt: new Date(),
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const artifactRepository = new SQLiteArtifactRepository();
