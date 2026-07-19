import { MemoryDomain, MemoryEntry } from "./types";
import { MemoryPlatform } from "./MemoryPlatform";

// ---------------------------------------------------------------------------
// Base Interface
// ---------------------------------------------------------------------------
export interface IMemoryFacet {
  store(content: string, importance?: number, confidence?: number): Promise<MemoryEntry>;
  retrieve(query: string): Promise<MemoryEntry[]>;
}

// ---------------------------------------------------------------------------
// Working Memory
// Short-lived reasoning state. Automatically discarded.
// Private to one agent.
// ---------------------------------------------------------------------------
export class WorkingMemory implements IMemoryFacet {
  constructor(private agentId: string, private storage = MemoryPlatform.getInstance()) {}

  async store(content: string, importance = 5, confidence = 1.0): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: `mem:working:${this.agentId}:${Date.now()}`,
      domain: "working",
      ownerId: this.agentId,
      content,
      confidence,
      timestamp: Date.now(),
      importance,
      ttlMs: 3600000 // 1 hour TTL
    };
    return this.storage.store(entry);
  }

  async retrieve(query: string): Promise<MemoryEntry[]> {
    return this.storage.retrieve("working", query, this.agentId);
  }
}

// ---------------------------------------------------------------------------
// Conversation Memory
// Conversation history. Summaries. Dialogue context.
// ---------------------------------------------------------------------------
export class ConversationMemory implements IMemoryFacet {
  constructor(private contextId: string, private storage = MemoryPlatform.getInstance()) {}

  async store(content: string, importance = 5, confidence = 1.0): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: `mem:conversation:${this.contextId}:${Date.now()}`,
      domain: "conversation",
      ownerId: this.contextId,
      content,
      confidence,
      timestamp: Date.now(),
      importance
    };
    return this.storage.store(entry);
  }

  async retrieve(query: string): Promise<MemoryEntry[]> {
    return this.storage.retrieve("conversation", query, this.contextId);
  }

  async summarizeAndCompress(): Promise<void> {
    await this.storage.compressMemory("conversation", this.contextId);
  }
}

// ---------------------------------------------------------------------------
// Execution Memory
// Execution Graphs. Workflow results. Task outputs.
// ---------------------------------------------------------------------------
export class ExecutionMemory implements IMemoryFacet {
  constructor(private executionContextId: string, private storage = MemoryPlatform.getInstance()) {}

  async store(content: string, importance = 8, confidence = 1.0): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: `mem:execution:${this.executionContextId}:${Date.now()}`,
      domain: "execution",
      ownerId: this.executionContextId,
      content,
      confidence,
      timestamp: Date.now(),
      importance
    };
    return this.storage.store(entry);
  }

  async retrieve(query: string): Promise<MemoryEntry[]> {
    return this.storage.retrieve("execution", query, this.executionContextId);
  }
}

// ---------------------------------------------------------------------------
// Knowledge Memory
// Documents. Embeddings. Ontology. Semantic search.
// Shared by policy.
// ---------------------------------------------------------------------------
export class KnowledgeMemory implements IMemoryFacet {
  constructor(private tenantId: string, private storage = MemoryPlatform.getInstance()) {}

  async store(content: string, importance = 10, confidence = 1.0): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: `mem:knowledge:${this.tenantId}:${Date.now()}`,
      domain: "knowledge",
      ownerId: "system", // Usually shared
      content,
      confidence,
      timestamp: Date.now(),
      importance
    };
    return this.storage.store(entry);
  }

  async retrieve(query: string): Promise<MemoryEntry[]> {
    // Knowledge retrieval strictly uses semantic search belonging to this domain
    // In a real system, this would call vector storage
    return this.storage.retrieve("knowledge", query, "system");
  }
}

// ---------------------------------------------------------------------------
// Reflection Memory
// Lessons learned. Post-execution analysis. Strategy improvements.
// Agent-local by default.
// ---------------------------------------------------------------------------
export class ReflectionMemory implements IMemoryFacet {
  constructor(private agentId: string, private storage = MemoryPlatform.getInstance()) {}

  async store(content: string, importance = 9, confidence = 1.0): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: `mem:reflection:${this.agentId}:${Date.now()}`,
      domain: "reflection",
      ownerId: this.agentId,
      content,
      confidence,
      timestamp: Date.now(),
      importance
    };
    return this.storage.store(entry);
  }

  async retrieve(query: string): Promise<MemoryEntry[]> {
    return this.storage.retrieve("reflection", query, this.agentId);
  }
}

// ---------------------------------------------------------------------------
// Long-Term Memory
// Persistent user preferences. Historical context.
// ---------------------------------------------------------------------------
export class LongTermMemory implements IMemoryFacet {
  constructor(private userId: string, private storage = MemoryPlatform.getInstance()) {}

  async store(content: string, importance = 7, confidence = 1.0): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: `mem:long-term:${this.userId}:${Date.now()}`,
      domain: "long-term",
      ownerId: this.userId,
      content,
      confidence,
      timestamp: Date.now(),
      importance
    };
    return this.storage.store(entry);
  }

  async retrieve(query: string): Promise<MemoryEntry[]> {
    return this.storage.retrieve("long-term", query, this.userId);
  }
}
