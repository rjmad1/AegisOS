// src/enterprise/performance/MultiLevelCacheFramework.ts
// L1, L2, Distributed, Semantic, and Specialized Caches for Enterprise SaaS

import * as fs from 'fs';
import * as path from 'path';

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class MultiLevelCacheFramework {
  private static instance: MultiLevelCacheFramework | null = null;

  // L1: In-Memory Cache
  private l1Cache: Map<string, { value: any; expiresAt: number; lastUsed: number }> = new Map();
  private maxL1Size = 5000;

  // Stats tracking
  private stats: Record<string, CacheStats> = {
    l1: { hits: 0, misses: 0, size: 0, hitRate: 0 },
    l2: { hits: 0, misses: 0, size: 0, hitRate: 0 },
    semantic: { hits: 0, misses: 0, size: 0, hitRate: 0 },
    prompt: { hits: 0, misses: 0, size: 0, hitRate: 0 },
  };

  // Temp directory for L2 Cache
  private l2Dir: string;

  private constructor() {
    this.l2Dir = path.join(process.cwd(), '.next', 'cache', 'aegisos_l2');
    try {
      if (!fs.existsSync(this.l2Dir)) {
        fs.mkdirSync(this.l2Dir, { recursive: true });
      }
    } catch (e) {
      // Fallback if writing is not permitted
      this.l2Dir = path.join(process.env.TEMP || '/tmp', 'aegisos_l2');
      try {
        if (!fs.existsSync(this.l2Dir)) fs.mkdirSync(this.l2Dir, { recursive: true });
      } catch (err) {}
    }
  }

  public static getInstance(): MultiLevelCacheFramework {
    if (!MultiLevelCacheFramework.instance) {
      MultiLevelCacheFramework.instance = new MultiLevelCacheFramework();
    }
    return MultiLevelCacheFramework.instance;
  }

  // ======== L1 (In-Memory) Cache ========

  public getL1<T>(key: string): T | null {
    const entry = this.l1Cache.get(key);
    if (!entry) {
      this.stats.l1.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.l1Cache.delete(key);
      this.stats.l1.misses++;
      return null;
    }

    entry.lastUsed = Date.now();
    this.stats.l1.hits++;
    this.updateHitRates();
    return entry.value as T;
  }

  public setL1<T>(key: string, value: T, ttlMs = 60000): void {
    if (this.l1Cache.size >= this.maxL1Size) {
      // LRU Eviction
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [k, v] of this.l1Cache.entries()) {
        if (v.lastUsed < oldestTime) {
          oldestTime = v.lastUsed;
          oldestKey = k;
        }
      }
      if (oldestKey) this.l1Cache.delete(oldestKey);
    }

    this.l1Cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      lastUsed: Date.now(),
    });
    this.stats.l1.size = this.l1Cache.size;
  }

  // ======== L2 (Disk-Backed) Cache ========

  public getL2<T>(key: string): T | null {
    const safeKey = this.getSafeFilename(key);
    const filePath = path.join(this.l2Dir, `${safeKey}.cache`);

    try {
      if (!fs.existsSync(filePath)) {
        this.stats.l2.misses++;
        return null;
      }

      const fileData = fs.readFileSync(filePath, 'utf8');
      const entry = JSON.parse(fileData);

      if (Date.now() > entry.expiresAt) {
        fs.unlinkSync(filePath);
        this.stats.l2.misses++;
        return null;
      }

      this.stats.l2.hits++;
      this.updateHitRates();
      return entry.value as T;
    } catch (e) {
      this.stats.l2.misses++;
      return null;
    }
  }

  public setL2<T>(key: string, value: T, ttlMs = 300000): void {
    const safeKey = this.getSafeFilename(key);
    const filePath = path.join(this.l2Dir, `${safeKey}.cache`);

    try {
      const entry = {
        value,
        expiresAt: Date.now() + ttlMs,
        savedAt: Date.now(),
      };
      fs.writeFileSync(filePath, JSON.stringify(entry), 'utf8');
      this.stats.l2.size = fs.readdirSync(this.l2Dir).length;
    } catch (e) {}
  }

  // ======== Semantic Cache ========

  public getSemantic<T>(prompt: string, similarityThreshold = 0.85): T | null {
    // Compare incoming prompt with known prompts in L1 Cache
    for (const [key, entry] of this.l1Cache.entries()) {
      if (!key.startsWith('prompt:')) continue;
      const cachedPrompt = key.replace('prompt:', '');
      const similarity = this.calculateSimilarity(prompt, cachedPrompt);

      if (similarity >= similarityThreshold && Date.now() <= entry.expiresAt) {
        this.stats.semantic.hits++;
        this.updateHitRates();
        return entry.value as T;
      }
    }
    this.stats.semantic.misses++;
    return null;
  }

  public setSemantic<T>(prompt: string, value: T, ttlMs = 600000): void {
    this.setL1(`prompt:${prompt}`, value, ttlMs);
  }

  // ======== Specialized Cache Helpers ========

  public getPromptCache(prompt: string): string | null {
    const res = this.getL1<string>(`prompt_compile:${prompt}`);
    if (res) this.stats.prompt.hits++;
    else this.stats.prompt.misses++;
    this.updateHitRates();
    return res;
  }

  public setPromptCache(prompt: string, compiled: string, ttlMs = 120000): void {
    this.setL1(`prompt_compile:${prompt}`, compiled, ttlMs);
  }

  // ======== Utilities ========

  private getSafeFilename(key: string): string {
    return key.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) {
      return Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    }

    // Simple Jaccard similarity based on words
    const w1 = new Set(s1.split(/\s+/));
    const w2 = new Set(s2.split(/\s+/));
    const intersection = new Set([...w1].filter(x => w2.has(x)));
    const union = new Set([...w1, ...w2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  private updateHitRates(): void {
    for (const cat of Object.keys(this.stats)) {
      const s = this.stats[cat];
      const total = s.hits + s.misses;
      s.hitRate = total > 0 ? Number((s.hits / total).toFixed(4)) : 0;
    }
  }

  public getCacheStats(): Record<string, CacheStats> {
    return { ...this.stats };
  }

  public clearAll(): void {
    this.l1Cache.clear();
    this.stats.l1.size = 0;
    try {
      const files = fs.readdirSync(this.l2Dir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.l2Dir, file));
      }
      this.stats.l2.size = 0;
    } catch (e) {}
  }
}

export const multiLevelCacheFramework = MultiLevelCacheFramework.getInstance();
export default multiLevelCacheFramework;
