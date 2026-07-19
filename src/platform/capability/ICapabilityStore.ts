// src/platform/capability/ICapabilityStore.ts
// Interface for pluggable Capability Registry persistent storage

import { CapabilityMetadata, CapabilityEvent } from "./types";

export interface ICapabilityStore {
  initialize(): Promise<void>;
  close(): Promise<void>;

  // Metadata operations
  getCapability(id: string): Promise<CapabilityMetadata | null>;
  saveCapability(metadata: CapabilityMetadata): Promise<void>;
  deleteCapability(id: string): Promise<boolean>;
  listCapabilities(filters?: { type?: string; status?: string }): Promise<CapabilityMetadata[]>;

  // Lifecycle Event operations
  logEvent(event: CapabilityEvent): Promise<void>;
  getEvents(capabilityId?: string, limit?: number): Promise<CapabilityEvent[]>;

  // Cache & Temporary Store operations
  getCache<T>(key: string): Promise<T | null>;
  setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  clearCache(key: string): Promise<void>;
}
