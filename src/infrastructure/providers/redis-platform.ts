// src/infrastructure/providers/redis-platform.ts
// Swappable Redis Platform Provider with local-first in-memory fallbacks

import { EventEmitter } from 'events';

// Interface definitions for Redis Platform
export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ILockProvider {
  acquireLock(key: string, ttlMs: number): Promise<boolean>;
  releaseLock(key: string): Promise<void>;
}

export interface ISessionProvider {
  getSession(id: string): Promise<any>;
  setSession(id: string, data: any, ttlSeconds?: number): Promise<void>;
  deleteSession(id: string): Promise<void>;
}

export interface IQueueProvider {
  enqueue(queueName: string, item: any): Promise<void>;
  dequeue(queueName: string): Promise<any | null>;
  getQueueLength(queueName: string): Promise<number>;
}

export interface IRateLimitProvider {
  checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }>;
}

export interface IPubSubProvider {
  publish(channel: string, message: any): Promise<void>;
  subscribe(channel: string, callback: (message: any) => void): Promise<void>;
}

export interface IJobProvider {
  scheduleJob(jobName: string, payload: any, delayMs: number): Promise<void>;
}

export interface IEventBufferProvider {
  pushEvent(bufferName: string, event: any): Promise<void>;
  flushEvents(bufferName: string, count: number): Promise<any[]>;
}

// -------------------------------------------------------------
// 1. In-Memory Implementations (Local-first Fallback)
// -------------------------------------------------------------

class MemoryCacheProvider implements ICacheProvider {
  private store = new Map<string, { val: any; expiresAt?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.val as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { val: value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

class MemoryLockProvider implements ILockProvider {
  private locks = new Map<string, number>(); // key -> expiresAt

  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const expiresAt = this.locks.get(key);
    
    if (expiresAt && now < expiresAt) {
      return false; // Lock is currently held
    }

    this.locks.set(key, now + ttlMs);
    return true;
  }

  async releaseLock(key: string): Promise<void> {
    this.locks.delete(key);
  }
}

class MemorySessionProvider implements ISessionProvider {
  private cache = new MemoryCacheProvider();

  async getSession(id: string): Promise<any> {
    return this.cache.get(`sess:${id}`);
  }

  async setSession(id: string, data: any, ttlSeconds = 86400): Promise<void> {
    await this.cache.set(`sess:${id}`, data, ttlSeconds);
  }

  async deleteSession(id: string): Promise<void> {
    await this.cache.delete(`sess:${id}`);
  }
}

class MemoryQueueProvider implements IQueueProvider {
  private queues = new Map<string, any[]>();

  async enqueue(queueName: string, item: any): Promise<void> {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    this.queues.get(queueName)!.push(item);
  }

  async dequeue(queueName: string): Promise<any | null> {
    const q = this.queues.get(queueName);
    if (!q || q.length === 0) return null;
    return q.shift();
  }

  async getQueueLength(queueName: string): Promise<number> {
    return this.queues.get(queueName)?.length || 0;
  }
}

class MemoryRateLimitProvider implements IRateLimitProvider {
  private hits = new Map<string, { count: number; resetTime: number }>();

  async checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    let record = this.hits.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
    }

    record.count++;
    this.hits.set(key, record);

    const allowed = record.count <= limit;
    const remaining = Math.max(0, limit - record.count);

    return { allowed, remaining };
  }
}

class MemoryPubSubProvider implements IPubSubProvider {
  private emitter = new EventEmitter();

  async publish(channel: string, message: any): Promise<void> {
    this.emitter.emit(channel, message);
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    this.emitter.on(channel, callback);
  }
}

class MemoryJobProvider implements IJobProvider {
  async scheduleJob(jobName: string, payload: any, delayMs: number): Promise<void> {
    setTimeout(() => {
      console.log(`[MemoryJobProvider] Executing scheduled job: ${jobName}`, payload);
    }, delayMs);
  }
}

class MemoryEventBufferProvider implements IEventBufferProvider {
  private buffers = new Map<string, any[]>();

  async pushEvent(bufferName: string, event: any): Promise<void> {
    if (!this.buffers.has(bufferName)) {
      this.buffers.set(bufferName, []);
    }
    this.buffers.get(bufferName)!.push(event);
  }

  async flushEvents(bufferName: string, count: number): Promise<any[]> {
    const buf = this.buffers.get(bufferName);
    if (!buf) return [];
    const chunk = buf.splice(0, count);
    return chunk;
  }
}

// -------------------------------------------------------------
// 2. Redis-Backed Implementations (Enterprise Cloud Mode)
// -------------------------------------------------------------

class RedisCacheProvider implements ICacheProvider {
  constructor(private client: any) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const payload = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, payload);
      } else {
        await this.client.set(key, payload);
      }
    } catch (err) {
      console.error('[RedisCacheProvider] Set failed:', err);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error('[RedisCacheProvider] Delete failed:', err);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushdb();
    } catch (err) {
      console.error('[RedisCacheProvider] Flush failed:', err);
    }
  }
}

class RedisLockProvider implements ILockProvider {
  constructor(private client: any) {}

  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    try {
      // Use Redis PX NX (Set if not exists with Millisecond TTL)
      const res = await this.client.set(`lock:${key}`, 'locked', 'PX', ttlMs, 'NX');
      return res === 'OK';
    } catch {
      return false;
    }
  }

  async releaseLock(key: string): Promise<void> {
    try {
      await this.client.del(`lock:${key}`);
    } catch {}
  }
}

class RedisSessionProvider implements ISessionProvider {
  constructor(private client: any) {}

  async getSession(id: string): Promise<any> {
    try {
      const data = await this.client.get(`sess:${id}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async setSession(id: string, data: any, ttlSeconds = 86400): Promise<void> {
    try {
      await this.client.setex(`sess:${id}`, ttlSeconds, JSON.stringify(data));
    } catch {}
  }

  async deleteSession(id: string): Promise<void> {
    try {
      await this.client.del(`sess:${id}`);
    } catch {}
  }
}

class RedisQueueProvider implements IQueueProvider {
  constructor(private client: any) {}

  async enqueue(queueName: string, item: any): Promise<void> {
    try {
      await this.client.rpush(`queue:${queueName}`, JSON.stringify(item));
    } catch (err) {
      console.error('[RedisQueueProvider] Enqueue failed:', err);
    }
  }

  async dequeue(queueName: string): Promise<any | null> {
    try {
      const data = await this.client.lpop(`queue:${queueName}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async getQueueLength(queueName: string): Promise<number> {
    try {
      return await this.client.llen(`queue:${queueName}`);
    } catch {
      return 0;
    }
  }
}

class RedisRateLimitProvider implements IRateLimitProvider {
  constructor(private client: any) {}

  async checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const redisKey = `ratelimit:${key}`;
      const multi = this.client.multi();
      multi.incr(redisKey);
      multi.ttl(redisKey);
      const [incrRes, ttlRes] = await multi.exec();
      
      const count = incrRes[1];
      let ttl = ttlRes[1];

      if (count === 1 || ttl === -1) {
        await this.client.pexpire(redisKey, windowMs);
        ttl = windowMs / 1000;
      }

      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);

      return { allowed, remaining };
    } catch {
      // Allow if Redis fails
      return { allowed: true, remaining: 1 };
    }
  }
}

class RedisPubSubProvider implements IPubSubProvider {
  private pubClient: any;
  private subClient: any;

  constructor(clientFactory: () => any) {
    this.pubClient = clientFactory();
    this.subClient = clientFactory();
  }

  async publish(channel: string, message: any): Promise<void> {
    try {
      await this.pubClient.publish(channel, JSON.stringify(message));
    } catch {}
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.subClient.subscribe(channel);
      this.subClient.on('message', (chan: string, msg: string) => {
        if (chan === channel) {
          try {
            callback(JSON.parse(msg));
          } catch {
            callback(msg);
          }
        }
      });
    } catch {}
  }
}

class RedisJobProvider implements IJobProvider {
  constructor(private client: any) {}

  async scheduleJob(jobName: string, payload: any, delayMs: number): Promise<void> {
    try {
      const runAt = Date.now() + delayMs;
      await this.client.zadd('scheduler:jobs', runAt, JSON.stringify({ jobName, payload }));
    } catch (err) {
      console.error('[RedisJobProvider] Schedule job failed:', err);
    }
  }
}

class RedisEventBufferProvider implements IEventBufferProvider {
  constructor(private client: any) {}

  async pushEvent(bufferName: string, event: any): Promise<void> {
    try {
      await this.client.rpush(`buffer:${bufferName}`, JSON.stringify(event));
    } catch {}
  }

  async flushEvents(bufferName: string, count: number): Promise<any[]> {
    try {
      const redisKey = `buffer:${bufferName}`;
      const multi = this.client.multi();
      multi.lrange(redisKey, 0, count - 1);
      multi.ltrim(redisKey, count, -1);
      const [rangeRes] = await multi.exec();
      const rawEvents = rangeRes[1] as string[];
      return rawEvents.map(e => JSON.parse(e));
    } catch {
      return [];
    }
  }
}

// -------------------------------------------------------------
// 3. Central Redis Coordinator (Orchestrator Factory)
// -------------------------------------------------------------

class RedisPlatform {
  public cache!: ICacheProvider;
  public locks!: ILockProvider;
  public sessions!: ISessionProvider;
  public queue!: IQueueProvider;
  public rateLimit!: IRateLimitProvider;
  public pubSub!: IPubSubProvider;
  public jobs!: IJobProvider;
  public eventBuffer!: IEventBufferProvider;
  
  private activeClient: any = null;

  constructor() {
    // Attempt dynamic connection to redis
    const redisUrl = process.env.REDIS_URL || '';
    const redisHost = process.env.REDIS_HOST || '';
    
    let isConnected = false;
    
    if (redisUrl || redisHost) {
      try {
        const IoRedis = require('ioredis');
        const clientOptions = redisUrl 
          ? redisUrl 
          : { host: redisHost, port: parseInt(process.env.REDIS_PORT || '6379') };

        this.activeClient = new IoRedis(clientOptions);
        
        isConnected = true;
        console.log('[RedisPlatform] Initialized Redis connection client.');
        
        this.cache = new RedisCacheProvider(this.activeClient);
        this.locks = new RedisLockProvider(this.activeClient);
        this.sessions = new RedisSessionProvider(this.activeClient);
        this.queue = new RedisQueueProvider(this.activeClient);
        this.rateLimit = new RedisRateLimitProvider(this.activeClient);
        this.pubSub = new RedisPubSubProvider(() => new IoRedis(clientOptions));
        this.jobs = new RedisJobProvider(this.activeClient);
        this.eventBuffer = new RedisEventBufferProvider(this.activeClient);
      } catch (err: any) {
        console.warn(`[RedisPlatform] Failed to link Redis client, falling back to local-first In-Memory engine: ${err.message}`);
      }
    }

    if (!isConnected) {
      // Local development fallback
      this.cache = new MemoryCacheProvider();
      this.locks = new MemoryLockProvider();
      this.sessions = new MemorySessionProvider();
      this.queue = new MemoryQueueProvider();
      this.rateLimit = new MemoryRateLimitProvider();
      this.pubSub = new MemoryPubSubProvider();
      this.jobs = new MemoryJobProvider();
      this.eventBuffer = new MemoryEventBufferProvider();
      console.log('[RedisPlatform] Running Local-First In-Memory simulation providers.');
    }
  }

  public getClient(): any {
    return this.activeClient;
  }
}

export const redisPlatform = new RedisPlatform();
export default redisPlatform;
