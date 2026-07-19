// src/platform/capability/SQLiteCapabilityStore.ts
// SQLite implementation of ICapabilityStore using node:sqlite DatabaseSync

import * as fs from "fs";
import * as path from "path";
import { ICapabilityStore } from "./ICapabilityStore";
import { CapabilityMetadata, CapabilityEvent } from "./types";

export class SQLiteCapabilityStore implements ICapabilityStore {
  private baseDir: string;
  private registryDb: any = null;
  private eventsDb: any = null;
  private cacheDb: any = null;

  constructor() {
    const stateDir = process.env.AEGISOS_STATE_DIR || "D:/AegisOS";
    this.baseDir = path.join(stateDir, "Data", "capabilities");
  }

  public async initialize(): Promise<void> {
    // 1. Ensure directory exists
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }

    const { DatabaseSync } = require("node:sqlite");

    // 2. Open DB files
    this.registryDb = new DatabaseSync(path.join(this.baseDir, "capability-registry.db"));
    this.eventsDb = new DatabaseSync(path.join(this.baseDir, "capability-events.db"));
    this.cacheDb = new DatabaseSync(path.join(this.baseDir, "capability-cache.db"));

    // Enable WAL mode for concurrency
    this.registryDb.exec("PRAGMA journal_mode = WAL;");
    this.eventsDb.exec("PRAGMA journal_mode = WAL;");
    this.cacheDb.exec("PRAGMA journal_mode = WAL;");

    // 3. Create Registry Table
    this.registryDb.exec(`
      CREATE TABLE IF NOT EXISTS capabilities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        version TEXT NOT NULL,
        publisher TEXT NOT NULL,
        repository TEXT NOT NULL,
        signature TEXT,
        trustScore REAL NOT NULL,
        status TEXT NOT NULL,
        installedAt TEXT NOT NULL,
        lastValidated TEXT,
        lastUsed TEXT,
        usageCount INTEGER NOT NULL,
        averageLatencyMs REAL NOT NULL,
        memoryProfileKb REAL NOT NULL,
        cpuProfileRatio REAL NOT NULL,
        gpuProfileMb REAL NOT NULL,
        dependencyGraph TEXT NOT NULL, -- JSON array
        compatibilityProfile TEXT NOT NULL, -- JSON string
        sandboxPolicy TEXT NOT NULL, -- JSON string
        securityPolicy TEXT NOT NULL, -- JSON string
        healthScore REAL NOT NULL,
        failureRate REAL NOT NULL,
        successRate REAL NOT NULL,
        retirementReason TEXT
      );
    `);

    // 4. Create Events Table
    this.eventsDb.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        capabilityId TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        eventType TEXT NOT NULL,
        state TEXT NOT NULL,
        durationMs INTEGER NOT NULL,
        resourceUsage TEXT NOT NULL, -- JSON string
        [trigger] TEXT NOT NULL,
        result TEXT NOT NULL,
        diagnostics TEXT
      );
    `);

    // 5. Create Cache Table
    this.cacheDb.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        [key] TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expiresAt INTEGER NOT NULL
      );
    `);
  }

  public async close(): Promise<void> {
    if (this.registryDb && typeof this.registryDb.close === "function") {
      try { this.registryDb.close(); } catch {}
    }
    if (this.eventsDb && typeof this.eventsDb.close === "function") {
      try { this.eventsDb.close(); } catch {}
    }
    if (this.cacheDb && typeof this.cacheDb.close === "function") {
      try { this.cacheDb.close(); } catch {}
    }
    this.registryDb = null;
    this.eventsDb = null;
    this.cacheDb = null;
  }

  // --- Registry operations ---

  public async getCapability(id: string): Promise<CapabilityMetadata | null> {
    if (!this.registryDb) await this.initialize();
    const stmt = this.registryDb.prepare("SELECT * FROM capabilities WHERE id = ?");
    const row = stmt.all(id)[0];
    if (!row) return null;
    return this.mapRowToMetadata(row);
  }

  public async saveCapability(m: CapabilityMetadata): Promise<void> {
    if (!this.registryDb) await this.initialize();
    const query = `
      INSERT INTO capabilities (
        id, name, type, version, publisher, repository, signature, trustScore, status,
        installedAt, lastValidated, lastUsed, usageCount, averageLatencyMs, memoryProfileKb,
        cpuProfileRatio, gpuProfileMb, dependencyGraph, compatibilityProfile, sandboxPolicy,
        securityPolicy, healthScore, failureRate, successRate, retirementReason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        type=excluded.type,
        version=excluded.version,
        publisher=excluded.publisher,
        repository=excluded.repository,
        signature=excluded.signature,
        trustScore=excluded.trustScore,
        status=excluded.status,
        installedAt=excluded.installedAt,
        lastValidated=excluded.lastValidated,
        lastUsed=excluded.lastUsed,
        usageCount=excluded.usageCount,
        averageLatencyMs=excluded.averageLatencyMs,
        memoryProfileKb=excluded.memoryProfileKb,
        cpuProfileRatio=excluded.cpuProfileRatio,
        gpuProfileMb=excluded.gpuProfileMb,
        dependencyGraph=excluded.dependencyGraph,
        compatibilityProfile=excluded.compatibilityProfile,
        sandboxPolicy=excluded.sandboxPolicy,
        securityPolicy=excluded.securityPolicy,
        healthScore=excluded.healthScore,
        failureRate=excluded.failureRate,
        successRate=excluded.successRate,
        retirementReason=excluded.retirementReason
    `;

    const stmt = this.registryDb.prepare(query);
    stmt.run(
      m.id,
      m.name,
      m.type,
      m.version,
      m.publisher,
      m.repository,
      m.signature ?? null,
      m.trustScore,
      m.status,
      m.installedAt,
      m.lastValidated ?? null,
      m.lastUsed ?? null,
      m.usageCount,
      m.averageLatencyMs,
      m.memoryProfileKb,
      m.cpuProfileRatio,
      m.gpuProfileMb,
      JSON.stringify(m.dependencyGraph),
      JSON.stringify(m.compatibilityProfile),
      JSON.stringify(m.sandboxPolicy),
      JSON.stringify(m.securityPolicy),
      m.healthScore,
      m.failureRate,
      m.successRate,
      m.retirementReason ?? null
    );
  }

  public async deleteCapability(id: string): Promise<boolean> {
    if (!this.registryDb) await this.initialize();
    const stmt = this.registryDb.prepare("DELETE FROM capabilities WHERE id = ?");
    const result = stmt.run(id);
    return (result as any)?.changes > 0;
  }

  public async listCapabilities(filters?: { type?: string; status?: string }): Promise<CapabilityMetadata[]> {
    if (!this.registryDb) await this.initialize();
    let query = "SELECT * FROM capabilities";
    const args: string[] = [];

    if (filters?.type && filters?.status) {
      query += " WHERE type = ? AND status = ?";
      args.push(filters.type, filters.status);
    } else if (filters?.type) {
      query += " WHERE type = ?";
      args.push(filters.type);
    } else if (filters?.status) {
      query += " WHERE status = ?";
      args.push(filters.status);
    }

    const stmt = this.registryDb.prepare(query);
    const rows = stmt.all(...args);
    return rows.map((r: any) => this.mapRowToMetadata(r));
  }

  // --- Event operations ---

  public async logEvent(e: CapabilityEvent): Promise<void> {
    if (!this.eventsDb) await this.initialize();
    const stmt = this.eventsDb.prepare(`
      INSERT INTO events (
        id, capabilityId, timestamp, eventType, state, durationMs, resourceUsage, [trigger], result, diagnostics
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      e.id,
      e.capabilityId,
      e.timestamp,
      e.eventType,
      e.state,
      e.durationMs,
      JSON.stringify(e.resourceUsage),
      e.trigger,
      e.result,
      e.diagnostics ?? null
    );
  }

  public async getEvents(capabilityId?: string, limit: number = 50): Promise<CapabilityEvent[]> {
    if (!this.eventsDb) await this.initialize();
    let query = "SELECT * FROM events";
    const args: any[] = [];

    if (capabilityId) {
      query += " WHERE capabilityId = ?";
      args.push(capabilityId);
    }
    query += " ORDER BY timestamp DESC LIMIT ?";
    args.push(limit);

    const stmt = this.eventsDb.prepare(query);
    const rows = stmt.all(...args);
    return rows.map((r: any) => ({
      id: r.id,
      capabilityId: r.capabilityId,
      timestamp: r.timestamp,
      eventType: r.eventType,
      state: r.state as any,
      durationMs: Number(r.durationMs),
      resourceUsage: JSON.parse(r.resourceUsage),
      trigger: r.trigger,
      result: r.result as any,
      diagnostics: r.diagnostics ?? undefined
    }));
  }

  // --- Cache operations ---

  public async getCache<T>(key: string): Promise<T | null> {
    if (!this.cacheDb) await this.initialize();
    const stmt = this.cacheDb.prepare("SELECT value, expiresAt FROM cache WHERE [key] = ?");
    const row = stmt.all(key)[0];
    if (!row) return null;

    if (Date.now() > row.expiresAt) {
      const delStmt = this.cacheDb.prepare("DELETE FROM cache WHERE [key] = ?");
      delStmt.run(key);
      return null;
    }

    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as any;
    }
  }

  public async setCache<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    if (!this.cacheDb) await this.initialize();
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const valStr = JSON.stringify(value);
    const stmt = this.cacheDb.prepare(`
      INSERT INTO cache ([key], value, expiresAt) VALUES (?, ?, ?)
      ON CONFLICT([key]) DO UPDATE SET value=excluded.value, expiresAt=excluded.expiresAt
    `);
    stmt.run(key, valStr, expiresAt);
  }

  public async clearCache(key: string): Promise<void> {
    if (!this.cacheDb) await this.initialize();
    const stmt = this.cacheDb.prepare("DELETE FROM cache WHERE [key] = ?");
    stmt.run(key);
  }

  // --- Mapping helpers ---

  private mapRowToMetadata(r: any): CapabilityMetadata {
    return {
      id: r.id,
      name: r.name,
      type: r.type as any,
      version: r.version,
      publisher: r.publisher,
      repository: r.repository,
      signature: r.signature ?? undefined,
      trustScore: Number(r.trustScore),
      status: r.status as any,
      installedAt: r.installedAt,
      lastValidated: r.lastValidated ?? undefined,
      lastUsed: r.lastUsed ?? undefined,
      usageCount: Number(r.usageCount),
      averageLatencyMs: Number(r.averageLatencyMs),
      memoryProfileKb: Number(r.memoryProfileKb),
      cpuProfileRatio: Number(r.cpuProfileRatio),
      gpuProfileMb: Number(r.gpuProfileMb),
      dependencyGraph: JSON.parse(r.dependencyGraph),
      compatibilityProfile: JSON.parse(r.compatibilityProfile),
      sandboxPolicy: JSON.parse(r.sandboxPolicy),
      securityPolicy: JSON.parse(r.securityPolicy),
      healthScore: Number(r.healthScore),
      failureRate: Number(r.failureRate),
      successRate: Number(r.successRate),
      retirementReason: r.retirementReason ?? undefined
    };
  }
}
export default SQLiteCapabilityStore;
