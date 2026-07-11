import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface HardenedEvent {
  id: string;
  name: string;
  timestamp: string;
  source: string;
  version: string; // e.g. "v1"
  priority: "low" | "medium" | "high" | "critical";
  securityClassification: "public" | "internal" | "restricted";
  retentionPolicy: "temp" | "session" | "archive";
  correlationId: string;
  traceId: string;
  payload: any;
}

export class HardenedEventBus {
  private static instance: HardenedEventBus | null = null;
  private emitter: EventEmitter;
  private dlqPath: string;
  private auditLogPath: string;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(200);
    this.dlqPath = path.resolve(process.cwd(), "databases", "event_dlq.json");
    this.auditLogPath = path.resolve(process.cwd(), "databases", "event_audit.json");
    this.ensureDirs();
  }

  public static getInstance(): HardenedEventBus {
    if (!HardenedEventBus.instance) {
      HardenedEventBus.instance = new HardenedEventBus();
    }
    return HardenedEventBus.instance;
  }

  private ensureDirs() {
    const dbDir = path.resolve(process.cwd(), "databases");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  // ponytail: schema validator checking event boundaries
  private validateSchema(event: HardenedEvent): string[] {
    const errors: string[] = [];
    if (!event.id) errors.push("Missing event ID");
    if (!event.name) errors.push("Missing event name");
    if (!event.version) errors.push("Missing event schema version");
    if (!event.correlationId) errors.push("Missing correlationId header");
    if (!event.traceId) errors.push("Missing traceparent ID");
    if (event.payload === undefined || event.payload === null) {
      errors.push("Event payload cannot be empty");
    }
    return errors;
  }

  public async publish(event: Partial<HardenedEvent> & { name: string; source: string; version: string; priority: HardenedEvent["priority"]; securityClassification: HardenedEvent["securityClassification"]; retentionPolicy: HardenedEvent["retentionPolicy"]; payload: any }): Promise<void> {
    const fullEvent: HardenedEvent = {
      ...event,
      id: event.id || "evt-" + crypto.randomUUID().slice(0, 8),
      timestamp: event.timestamp || new Date().toISOString(),
      correlationId: event.correlationId || "corr-" + crypto.randomUUID().slice(0, 6),
      traceId: event.traceId || "trace-" + crypto.randomUUID().slice(0, 6),
    };

    // Schema Validation
    const validationErrors = this.validateSchema(fullEvent);
    if (validationErrors.length > 0) {
      console.error(`[EventBus] Schema Validation Failed for ${event.name}:`, validationErrors);
      this.routeToDLQ(fullEvent, `Schema validation failure: ${validationErrors.join(", ")}`);
      return;
    }

    console.log(`[EventBus:Publish] ${fullEvent.name} [Trace: ${fullEvent.traceId}] [Class: ${fullEvent.securityClassification}]`);
    
    // Log Audit Trail
    this.logToAudit(fullEvent);

    // Dispatch
    const listenersCount = this.emitter.listenerCount(fullEvent.name);
    if (listenersCount === 0) {
      console.warn(`[EventBus] No active consumers registered for: ${fullEvent.name}`);
    }

    this.emitter.emit(fullEvent.name, fullEvent);
  }

  private subscriptions: Map<string, { name: string; wrapper: any }> = new Map();

  public subscribe(name: string, handler: (event: HardenedEvent) => void | Promise<void>, retryCount = 2): string {
    const subId = `sub-${name}-${crypto.randomBytes(3).toString("hex")}`;
    
    const wrapper = async (event: HardenedEvent) => {
      let attempts = 0;
      while (attempts <= retryCount) {
        try {
          const res = handler(event);
          if (res instanceof Promise) {
            await res;
          }
          return; // Success
        } catch (err: any) {
          attempts++;
          console.warn(`[EventBus] Handler execution failed on subscription ${subId} (Attempt ${attempts}/${retryCount + 1}):`, err.message);
          if (attempts > retryCount) {
            console.error(`[EventBus] Max retries exceeded. Routing to DLQ.`);
            this.routeToDLQ(event, `Handler sub ${subId} execution failed: ${err.message}`);
          } else {
            // Constant backoff
            await new Promise((r) => setTimeout(r, 500 * attempts));
          }
        }
      }
    };

    this.emitter.on(name, wrapper);
    this.subscriptions.set(subId, { name, wrapper });
    return subId;
  }

  public unsubscribe(subId: string): void {
    const sub = this.subscriptions.get(subId);
    if (sub) {
      this.emitter.off(sub.name, sub.wrapper);
      this.subscriptions.delete(subId);
      console.log(`[EventBus] Unsubscribed subId: ${subId}`);
    }
  }

  private routeToDLQ(event: HardenedEvent, reason: string) {
    try {
      let dlq: any[] = [];
      if (fs.existsSync(this.dlqPath)) {
        dlq = JSON.parse(fs.readFileSync(this.dlqPath, "utf-8"));
      }
      dlq.push({ event, reason, failedAt: new Date().toISOString() });
      fs.writeFileSync(this.dlqPath, JSON.stringify(dlq, null, 2), "utf-8");
      console.log(`[EventBus] Dead Letter Queue updated: ${event.name} (Reason: ${reason})`);
    } catch (err) {
      console.error("[EventBus] Failed to route to DLQ:", err);
    }
  }

  private logToAudit(event: HardenedEvent) {
    try {
      let audit: any[] = [];
      if (fs.existsSync(this.auditLogPath)) {
        audit = JSON.parse(fs.readFileSync(this.auditLogPath, "utf-8"));
      }
      audit.push(event);
      // Keep audit logs capped at 200 items for local-first sizing limits
      if (audit.length > 200) audit = audit.slice(-200);
      fs.writeFileSync(this.auditLogPath, JSON.stringify(audit, null, 2), "utf-8");
    } catch (err) {
      console.error("[EventBus] Failed to write event audit:", err);
    }
  }

  public getDLQ(): any[] {
    if (fs.existsSync(this.dlqPath)) {
      return JSON.parse(fs.readFileSync(this.dlqPath, "utf-8"));
    }
    return [];
  }

  public getAuditTrail(): HardenedEvent[] {
    if (fs.existsSync(this.auditLogPath)) {
      return JSON.parse(fs.readFileSync(this.auditLogPath, "utf-8"));
    }
    return [];
  }
}

export const hardenedEventBus = HardenedEventBus.getInstance();
export const eventBus = hardenedEventBus;
export default hardenedEventBus;
