import * as fs from "fs";
import * as path from "path";

export type MemoryDomain =
  | "working"
  | "conversation"
  | "session"
  | "agent"
  | "semantic"
  | "procedural"
  | "episodic"
  | "long-term"
  | "knowledge";

export interface MemoryObject {
  id: string;
  domain: MemoryDomain;
  owner: string;
  content: string;
  confidence: number; // 0.0 to 1.0
  source: string;
  timestamp: string;
  version: string;
  ttl: number; // in milliseconds, 0 for infinite
  retentionPolicy: "session" | "persistent" | "ephemeral";
  importanceScore: number; // 0 to 10
  conflictResolution: "override" | "merge" | "ignore";
  forgettingStrategy: "lru" | "ttl-expire" | "keep-permanent";
  provenance: string;
}

export class MemoryArchitecture {
  private static instance: MemoryArchitecture | null = null;
  private memoryDbPath: string;
  private memoryStore: Map<string, MemoryObject> = new Map();

  private constructor() {
    const dbDir = process.env.OPS_DATABASES_DIR || path.resolve(process.cwd(), "databases");
    this.memoryDbPath = path.resolve(dbDir, "memory_store.json");
    this.ensureDirs();
    this.loadMemory();
  }

  public static getInstance(): MemoryArchitecture {
    if (!MemoryArchitecture.instance) {
      MemoryArchitecture.instance = new MemoryArchitecture();
    }
    return MemoryArchitecture.instance;
  }

  private ensureDirs() {
    const dbDir = path.dirname(this.memoryDbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  private loadMemory() {
    try {
      if (fs.existsSync(this.memoryDbPath)) {
        const raw = fs.readFileSync(this.memoryDbPath, "utf-8");
        const list = JSON.parse(raw) as MemoryObject[];
        list.forEach((m) => this.memoryStore.set(m.id, m));
      }
    } catch (err) {
      console.error("[MemoryArchitecture] Failed to load memory database:", err);
    }
  }

  private saveMemory() {
    try {
      const list = Array.from(this.memoryStore.values());
      fs.writeFileSync(this.memoryDbPath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("[MemoryArchitecture] Failed to save memory database:", err);
    }
  }

  public async setMemory(
    id: string,
    domain: MemoryDomain,
    owner: string,
    content: string,
    options?: Partial<Omit<MemoryObject, "id" | "domain" | "owner" | "content" | "timestamp">>
  ): Promise<MemoryObject> {
    const existing = this.memoryStore.get(id);
    
    // Conflict resolution check
    if (existing && options?.conflictResolution === "ignore") {
      return existing;
    }

    let finalContent = content;
    if (existing && existing.conflictResolution === "merge") {
      finalContent = `${existing.content}\n[Merged]: ${content}`;
    }

    const versionNum = existing ? parseFloat(existing.version) + 1 : 1;

    const memoryObj: MemoryObject = {
      id,
      domain,
      owner,
      content: finalContent,
      confidence: options?.confidence ?? 1.0,
      source: options?.source ?? "console-action",
      timestamp: new Date().toISOString(),
      version: versionNum.toFixed(1),
      ttl: options?.ttl ?? 0,
      retentionPolicy: options?.retentionPolicy ?? "persistent",
      importanceScore: options?.importanceScore ?? 5,
      conflictResolution: options?.conflictResolution ?? "override",
      forgettingStrategy: options?.forgettingStrategy ?? "keep-permanent",
      provenance: options?.provenance ?? `Action log on ${new Date().toISOString()}`
    };

    this.memoryStore.set(id, memoryObj);
    this.saveMemory();
    
    console.log(`[Memory] Stored domain: ${domain} | Key: ${id} | Version: ${memoryObj.version}`);
    return memoryObj;
  }

  public getMemory(id: string): MemoryObject | null {
    const mem = this.memoryStore.get(id);
    if (!mem) return null;

    // TTL Expiry check
    if (mem.ttl > 0 && mem.forgettingStrategy === "ttl-expire") {
      const elapsed = Date.now() - new Date(mem.timestamp).getTime();
      if (elapsed > mem.ttl) {
        this.memoryStore.delete(id);
        this.saveMemory();
        console.log(`[Memory] Evicted expired memory object: ${id}`);
        return null;
      }
    }

    return mem;
  }

  public queryMemoryByDomain(domain: MemoryDomain): MemoryObject[] {
    return Array.from(this.memoryStore.values()).filter((m) => m.domain === domain);
  }

  public deleteMemory(id: string) {
    this.memoryStore.delete(id);
    this.saveMemory();
    console.log(`[Memory] Deleted memory key: ${id}`);
  }
}

export const memoryArchitecture = MemoryArchitecture.getInstance();
export default memoryArchitecture;
