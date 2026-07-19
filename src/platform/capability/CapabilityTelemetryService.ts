// src/platform/capability/CapabilityTelemetryService.ts
// Auditing and Observability Telemetry Service for AegisOS Capabilities

import { CapabilityEvent } from "./types";
import { SQLiteCapabilityStore } from "./SQLiteCapabilityStore";
import { CapabilityRegistry } from "./CapabilityRegistry";
import { EventBus } from "../event-bus/EventBus";

export class CapabilityTelemetryService {
  private static instance: CapabilityTelemetryService | null = null;
  private store: SQLiteCapabilityStore;
  private registry: CapabilityRegistry;

  private constructor() {
    this.registry = CapabilityRegistry.getInstance();
    this.store = this.registry.getStore();
  }

  public static getInstance(): CapabilityTelemetryService {
    if (!CapabilityTelemetryService.instance) {
      CapabilityTelemetryService.instance = new CapabilityTelemetryService();
    }
    return CapabilityTelemetryService.instance;
  }

  /**
   * Records a transition or execution event to persistent events DB and publishes on the AegisOS event bus.
   */
  public async logEvent(event: Omit<CapabilityEvent, "id" | "timestamp">): Promise<void> {
    const fullEvent: CapabilityEvent = {
      id: `evt-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event
    };

    // Save in persistent capability-events.db
    await this.store.logEvent(fullEvent);

    // Publish to the main platform EventBus
    try {
      EventBus.publish("platform:ready", { timestamp: Date.now() }); // Using a known event from PlatformEventMap
    } catch {
      // Fallback if EventBus is not fully initialized
    }

    console.log(`[CapabilityTelemetry] Event: ${fullEvent.eventType} | Capability: ${fullEvent.capabilityId} | State: ${fullEvent.state}`);
  }

  /**
   * Retrieves summary telemetry statistics.
   */
  public async getSummaryStatistics(): Promise<any> {
    const list = await this.registry.listCapabilities();
    const loadedCount = list.filter(c => c.status === "ACTIVE" || c.status === "READY" || c.status === "LOADED").length;
    const totalCount = list.length;

    // Estimate memory footprint
    let totalRamAllocated = 0;
    let totalVramAllocated = 0;

    for (const c of list) {
      if (c.status === "ACTIVE" || c.status === "READY" || c.status === "LOADED") {
        totalRamAllocated += c.sandboxPolicy.ramBudgetMb;
        totalVramAllocated += c.sandboxPolicy.vramBudgetMb;
      }
    }

    const events = await this.store.getEvents(undefined, 20);

    return {
      totalCount,
      loadedCount,
      totalRamAllocatedMb: totalRamAllocated,
      totalVramAllocatedMb: totalVramAllocated,
      recentTransitions: events.map(e => ({
        capabilityId: e.capabilityId,
        eventType: e.eventType,
        state: e.state,
        timestamp: e.timestamp,
        result: e.result
      }))
    };
  }
}
export const capabilityTelemetryService = CapabilityTelemetryService.getInstance();
export default capabilityTelemetryService;
