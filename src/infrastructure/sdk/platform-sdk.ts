import { hardenedEventBus, HardenedEvent } from "../events/event-bus";
import { jobQueue } from "../jobs/job-queue";
import { memoryArchitecture, MemoryDomain, MemoryObject } from "../memory/memory-architecture";
import { capabilityRegistry, CapabilityPluginManifest } from "../registry/capability-registry";
import { policyEnforcer } from "../security/policy-enforcer";
import { telemetryTracker } from "../observability/telemetry";

export interface IPlatformSdk {
  events: {
    publish(event: Omit<HardenedEvent, "id" | "timestamp" | "correlationId" | "traceId"> & { correlationId?: string; traceId?: string }): Promise<void>;
    subscribe(name: string, handler: (event: HardenedEvent) => void | Promise<void>): string;
  };
  jobs: {
    enqueue(name: string, payload: any, priority?: "low" | "medium" | "high" | "critical"): Promise<any>;
    get(id: string): Promise<any>;
    cancel(id: string): Promise<boolean>;
  };
  memory: {
    store(id: string, domain: MemoryDomain, owner: string, content: string, options?: any): Promise<MemoryObject>;
    retrieve(id: string): MemoryObject | null;
    query(domain: MemoryDomain): MemoryObject[];
  };
  capabilities: {
    register(manifest: CapabilityPluginManifest): void;
    query(name: string): CapabilityPluginManifest[];
  };
  security: {
    verifyRole(userId: string, role: "admin" | "developer" | "reviewer"): boolean;
    sanitizePII(text: string): string;
    detectInjection(prompt: string): boolean;
  };
  telemetry: {
    createTrace(): { traceId: string; activeSpanId: string };
    startSpan(traceId: string, name: string, parentSpanId?: string): string;
    endSpan(traceId: string, spanId: string, attributes?: Record<string, any>): void;
  };
}

export const platformSdk: IPlatformSdk = {
  events: {
    publish: (event) => hardenedEventBus.publish(event),
    subscribe: (name, handler) => hardenedEventBus.subscribe(name, handler)
  },
  jobs: {
    enqueue: (name, payload, priority) => jobQueue.add(name, payload, { priority }),
    get: (id) => jobQueue.getJob(id),
    cancel: (id) => jobQueue.cancelJob(id)
  },
  memory: {
    store: (id, domain, owner, content, options) => memoryArchitecture.setMemory(id, domain, owner, content, options),
    retrieve: (id) => memoryArchitecture.getMemory(id),
    query: (domain) => memoryArchitecture.queryMemoryByDomain(domain)
  },
  capabilities: {
    register: (manifest) => capabilityRegistry.registerPlugin(manifest),
    query: (name) => capabilityRegistry.queryCapability(name)
  },
  security: {
    verifyRole: (userId, role) => policyEnforcer.authorizeRole(userId, role),
    sanitizePII: (text) => policyEnforcer.maskPII(text),
    detectInjection: (prompt) => policyEnforcer.containsInjection(prompt)
  },
  telemetry: {
    createTrace: () => telemetryTracker.createTrace(),
    startSpan: (traceId, name, parentSpanId) => telemetryTracker.startSpan(traceId, name, parentSpanId),
    endSpan: (traceId, spanId, attributes) => telemetryTracker.endSpan(traceId, spanId, attributes)
  }
};

export default platformSdk;
