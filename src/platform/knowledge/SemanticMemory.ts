// ============================================================================
// EKOS Semantic Memory Platform — Phase 9
// ============================================================================

import * as fs from "fs";
import * as path from "path";
import { SemanticMemoryCell, MemoryType } from "@/types/knowledge-fabric";

export class SemanticMemoryPlatform {
  private static instance: SemanticMemoryPlatform | null = null;
  private memoryCells: Map<string, SemanticMemoryCell> = new Map();
  private dbPath: string;

  private constructor() {
    const dbDir = path.resolve(process.cwd(), "databases");
    this.dbPath = path.resolve(dbDir, "semantic_memory_store.json");
    this.ensureDirectory();
    this.loadMemoryCells();
  }

  public static getInstance(): SemanticMemoryPlatform {
    if (!SemanticMemoryPlatform.instance) {
      SemanticMemoryPlatform.instance = new SemanticMemoryPlatform();
    }
    return SemanticMemoryPlatform.instance;
  }

  private ensureDirectory() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadMemoryCells() {
    try {
      // 1. Try reading specialized semantic memory store
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, "utf-8");
        const list = JSON.parse(raw) as SemanticMemoryCell[];
        list.forEach(c => this.memoryCells.set(c.id, c));
      } else {
        // Fallback: Bootstrap some default semantic memory cells interlinked
        this.bootstrapDefaultMemories();
      }

      // 2. Synchronize/import general AI memories from standard ai_memory_store.json if it exists
      const aiMemoryPath = path.resolve(process.cwd(), "databases", "ai_memory_store.json");
      if (fs.existsSync(aiMemoryPath)) {
        const rawAi = fs.readFileSync(aiMemoryPath, "utf-8");
        const listAi = JSON.parse(rawAi) as any[];
        listAi.forEach(item => {
          const id = item.id || `mem:generic:${Date.now()}`;
          if (!this.memoryCells.has(id)) {
            this.memoryCells.set(id, {
              id,
              type: this.mapDomainToMemoryType(item.domain),
              name: item.id.replace("mem:", "").replace(/:/g, " "),
              content: item.content || "",
              ownerId: item.ownerId || "system",
              createdAt: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
              modifiedAt: new Date().toISOString(),
              confidence: item.confidence ?? 0.9,
              trustScore: 0.85,
              sourceUri: "databases/ai_memory_store.json",
              linkedMemoryIds: []
            });
          }
        });
      }
    } catch (err) {
      console.error("[SemanticMemoryPlatform] Failed to load semantic memory:", err);
    }
  }

  private saveMemoryCells() {
    try {
      const list = Array.from(this.memoryCells.values());
      fs.writeFileSync(this.dbPath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("[SemanticMemoryPlatform] Failed to save semantic memory:", err);
    }
  }

  private mapDomainToMemoryType(domain: string): MemoryType {
    switch (domain) {
      case "workspace": return "project";
      case "conversation": return "conversation";
      case "user": return "customer";
      case "agent": return "agent";
      default: return "entity";
    }
  }

  private bootstrapDefaultMemories() {
    const memories: SemanticMemoryCell[] = [
      {
        id: "mem:project:openclaw",
        type: "project",
        name: "OpenClaw Platform Workspace",
        content: "Core Next.js workspace integrating LiteLLM orchestration agents, workflow runners, and zero-trust modules.",
        ownerId: "usr-admin-01",
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        modifiedAt: new Date().toISOString(),
        confidence: 1.0,
        trustScore: 0.98,
        sourceUri: "git://repository",
        linkedMemoryIds: ["mem:arch:kernel", "mem:adr:sqlite-backend"]
      },
      {
        id: "mem:arch:kernel",
        type: "architecture",
        name: "Platform Kernel Modular Architecture",
        content: "Platform Kernel boots statically imported PlatformModules, resolves singleton DI services, and runs self-healing diagnostics.",
        ownerId: "usr-admin-01",
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        modifiedAt: new Date().toISOString(),
        confidence: 0.95,
        trustScore: 0.95,
        sourceUri: "docs/architecture.md",
        linkedMemoryIds: ["mem:project:openclaw", "mem:code:platform-kernel"]
      },
      {
        id: "mem:adr:sqlite-backend",
        type: "adr",
        name: "ADR-004: SQLite Storage for Runtime Memory",
        content: "Decided to run local SQLite dev.db via Prisma client for lightweight service states, ensuring transaction isolation.",
        ownerId: "usr-admin-01",
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        modifiedAt: new Date().toISOString(),
        confidence: 1.0,
        trustScore: 0.99,
        sourceUri: "adr/0004-sqlite-storage.md",
        linkedMemoryIds: ["mem:project:openclaw", "mem:req:transaction-isolation"]
      },
      {
        id: "mem:req:transaction-isolation",
        type: "requirement",
        name: "REQ-012: Zero Trust Transaction Audit Isolation",
        content: "Requires all audit records and events to be cryptographically hashed and isolated to prevent log tampering.",
        ownerId: "usr-admin-01",
        createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
        modifiedAt: new Date().toISOString(),
        confidence: 0.95,
        trustScore: 0.92,
        sourceUri: "docs/requirements/security.md",
        linkedMemoryIds: ["mem:adr:sqlite-backend", "mem:risk:tampered-audits"]
      },
      {
        id: "mem:risk:tampered-audits",
        type: "risk",
        name: "RISK-03: Log Tampering via Compromised Admin Account",
        content: "High risk of audit trail falsification if admin key gets compromised. Mitigation: Write-only event log streams.",
        ownerId: "usr-admin-01",
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        modifiedAt: new Date().toISOString(),
        confidence: 0.8,
        trustScore: 0.85,
        sourceUri: "docs/risks/security.md",
        linkedMemoryIds: ["mem:req:transaction-isolation", "mem:issue:unencrypted-secrets"]
      },
      {
        id: "mem:issue:unencrypted-secrets",
        type: "issue",
        name: "ISSUE-401: Plaintext Secrets in Local Environment Configs",
        content: "Active issue: dotenv templates occasionally leakage api keys. Fixed by Zero Trust Secret Provider IV salts.",
        ownerId: "usr-admin-01",
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        modifiedAt: new Date().toISOString(),
        confidence: 0.9,
        trustScore: 0.9,
        sourceUri: "jira://ISSUE-401",
        linkedMemoryIds: ["mem:risk:tampered-audits"]
      },
      {
        id: "mem:code:platform-kernel",
        type: "code",
        name: "Code: PlatformKernel.ts Orchestrator",
        content: "Source code file src/platform/kernel/PlatformKernel.ts containing the executeBootSequence and retry recovery algorithms.",
        ownerId: "usr-admin-01",
        createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
        modifiedAt: new Date().toISOString(),
        confidence: 1.0,
        trustScore: 0.98,
        sourceUri: "src/platform/kernel/PlatformKernel.ts",
        linkedMemoryIds: ["mem:arch:kernel"]
      }
    ];

    memories.forEach(m => this.memoryCells.set(m.id, m));
    this.saveMemoryCells();
  }

  // --- API Methods ---
  public getMemoryCell(id: string): SemanticMemoryCell | null {
    return this.memoryCells.get(id) || null;
  }

  public getMemoryCells(): SemanticMemoryCell[] {
    return Array.from(this.memoryCells.values());
  }

  public addMemoryCell(cell: Omit<SemanticMemoryCell, "createdAt" | "modifiedAt">): SemanticMemoryCell {
    const now = new Date().toISOString();
    const newCell: SemanticMemoryCell = {
      ...cell,
      createdAt: now,
      modifiedAt: now
    };
    this.memoryCells.set(newCell.id, newCell);
    this.saveMemoryCells();
    return newCell;
  }

  public linkMemories(sourceId: string, targetId: string): boolean {
    const src = this.memoryCells.get(sourceId);
    const tgt = this.memoryCells.get(targetId);

    if (!src || !tgt) return false;

    if (!src.linkedMemoryIds.includes(targetId)) {
      src.linkedMemoryIds.push(targetId);
      src.modifiedAt = new Date().toISOString();
    }
    if (!tgt.linkedMemoryIds.includes(sourceId)) {
      tgt.linkedMemoryIds.push(sourceId);
      tgt.modifiedAt = new Date().toISOString();
    }

    this.saveMemoryCells();
    return true;
  }
}

export const semanticMemoryPlatform = SemanticMemoryPlatform.getInstance();
export default semanticMemoryPlatform;
