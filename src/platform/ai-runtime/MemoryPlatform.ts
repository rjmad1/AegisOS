import * as fs from "fs";
import * as path from "path";
import { MemoryEntry, MemoryDomain } from "./types";

export class MemoryPlatform {
  private static instance: MemoryPlatform | null = null;
  private memoryStore: Map<string, MemoryEntry> = new Map();
  private dbPath: string;

  private constructor() {
    const dbDir = process.env.OPS_DATABASES_DIR || path.resolve(process.cwd(), "databases");
    this.dbPath = path.resolve(dbDir, "ai_memory_store.json");
    this.ensureDirs();
    this.loadMemory();
    this.seedDefaultMemories();
  }

  public static getInstance(): MemoryPlatform {
    if (!MemoryPlatform.instance) {
      MemoryPlatform.instance = new MemoryPlatform();
    }
    return MemoryPlatform.instance;
  }

  private ensureDirs(): void {
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  private loadMemory(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, "utf-8");
        const list = JSON.parse(raw) as MemoryEntry[];
        list.forEach((m) => this.memoryStore.set(m.id, m));
      }
    } catch (err) {
      console.error("[MemoryPlatform] Failed to load memory file:", err);
    }
  }

  private saveMemory(): void {
    try {
      const list = Array.from(this.memoryStore.values());
      fs.writeFileSync(this.dbPath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("[MemoryPlatform] Failed to save memory file:", err);
    }
  }

  private seedDefaultMemories(): void {
    if (this.memoryStore.size > 0) return;

    const seeds: MemoryEntry[] = [
      {
        id: "mem:workspace:settings",
        domain: "workspace",
        ownerId: "system",
        content: "Developer workspace relies on TypeScript compiler, Next.js framework, and Prisma ORM.",
        confidence: 1.0,
        timestamp: Date.now(),
        importance: 9,
      },
      {
        id: "mem:user:preferences",
        domain: "user",
        ownerId: "usr-admin-01",
        content: "User prefers local execution using Ollama:gemma2:9b and strict compliance checks.",
        confidence: 0.95,
        timestamp: Date.now(),
        importance: 8,
      },
    ];

    for (const s of seeds) {
      this.memoryStore.set(s.id, s);
    }
    this.saveMemory();
  }

  public async store(entry: MemoryEntry): Promise<MemoryEntry> {
    // Check for expiration of expired elements before saving
    this.evictExpired();

    const timestamp = entry.timestamp || Date.now();
    const finalEntry = { ...entry, timestamp };
    
    this.memoryStore.set(entry.id, finalEntry);
    this.saveMemory();
    
    console.log(`[MemoryPlatform] Stored memory ${entry.id} in domain ${entry.domain}`);
    return finalEntry;
  }

  /**
   * Retrieves memories matching domain, ownerId, and a keyword search query.
   * Ranks results by a combination of importance, confidence, and match relevance.
   */
  public async retrieve(domain: MemoryDomain, query: string, ownerId: string): Promise<MemoryEntry[]> {
    this.evictExpired();

    const list = Array.from(this.memoryStore.values()).filter(
      (m) => m.domain === domain && (m.ownerId === ownerId || m.ownerId === "system")
    );

    const scored = list.map((m) => {
      let score = m.importance * 0.1 + m.confidence * 0.5;
      
      if (query) {
        const q = query.toLowerCase();
        const contentMatch = m.content.toLowerCase().includes(q);
        if (contentMatch) score += 2.0; // Boost matching text
      }

      return { entry: m, score };
    });

    // Sort by descending score
    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.entry);
  }

  public getEntry(id: string): MemoryEntry | undefined {
    this.evictExpired();
    return this.memoryStore.get(id);
  }

  public deleteEntry(id: string): void {
    this.memoryStore.delete(id);
    this.saveMemory();
  }

  /**
   * Memory Compression: Compresses multiple old memories into a single consolidated summary.
   * Evicts the compressed entries to prevent context bloat.
   */
  public async compressMemory(domain: MemoryDomain, ownerId: string): Promise<void> {
    const entries = Array.from(this.memoryStore.values()).filter(
      (m) => m.domain === domain && m.ownerId === ownerId
    );

    if (entries.length <= 2) return; // Not enough memory blocks to compress

    const consolidatedText = entries
      .map((e) => `[${new Date(e.timestamp).toISOString()}] ${e.content}`)
      .join("\n");

    const compressedContent = `CONSOLIDATED MEMORY SUMMARY (${domain.toUpperCase()}):\n${consolidatedText.slice(0, 1000)}\n[End of consolidated summary]`;

    // Evict old entries
    for (const e of entries) {
      this.memoryStore.delete(e.id);
    }

    // Create a new compressed memory entry
    const compressedEntry: MemoryEntry = {
      id: `mem:compressed:${domain}:${ownerId}:${Date.now()}`,
      domain: "long-term", // Promote to long-term memory
      ownerId,
      content: compressedContent,
      confidence: 0.9,
      timestamp: Date.now(),
      importance: 7,
      metadata: { compressedDomain: domain, originalCount: entries.length },
    };

    this.memoryStore.set(compressedEntry.id, compressedEntry);
    this.saveMemory();
    console.log(`[MemoryPlatform] Compressed ${entries.length} ${domain} memories into consolidated long-term memory.`);
  }

  /**
   * Helper routine checking for TTL expirations and deleting expired entries.
   */
  private evictExpired(): void {
    let changed = false;
    const now = Date.now();
    
    for (const [id, entry] of this.memoryStore.entries()) {
      if (entry.ttlMs && entry.ttlMs > 0) {
        if (now - entry.timestamp > entry.ttlMs) {
          this.memoryStore.delete(id);
          changed = true;
          console.log(`[MemoryPlatform] Evicted expired memory: ${id}`);
        }
      }
    }

    if (changed) {
      this.saveMemory();
    }
  }
}
export default MemoryPlatform;
