import { HardenedEventBus } from '../../../infrastructure/events/event-bus';
import { qualificationOrchestrator } from './orchestrator';
import { TriggerSource, QualificationRequest } from '../core/types';
import * as crypto from 'crypto';

export class TriggerManager {
  private activeSubscriptions: string[] = [];
  private intervals: NodeJS.Timeout[] = [];

  public start(): void {
    console.log('⏰ [TriggerManager] Initializing qualification trigger sources...');

    const eventBus = HardenedEventBus.getInstance();

    // 1. Subscribe to events that should trigger a qualification check
    const eventSubscriptions = [
      'CapabilityRegistered',
      'CapabilityUpdated',
      'ConfigurationChanged',
      'ModelChanged',
      'DependencyUpdated',
      'ReleaseCandidateCreated'
    ];

    for (const eventName of eventSubscriptions) {
      const subId = eventBus.subscribe(eventName, async (event) => {
        console.log(`🔔 [TriggerManager] Event "${eventName}" detected. Queueing qualification...`);
        await this.triggerQualification({
          reason: `Event-driven qualification triggered by event: ${eventName}`,
          triggerSource: 'EVENT',
          correlationId: event.correlationId || crypto.randomUUID().slice(0, 8),
          priority: 'MEDIUM',
          scope: this.mapEventToScope(eventName)
        });
      });
      this.activeSubscriptions.push(subId);
    }

    // 2. Set up scheduled checks (e.g. dynamic periodic check every 30 minutes in production, or quick checks in dev)
    const runIntervalMs = process.env.NODE_ENV === 'test' ? 600000 : 1800000; // 10m in test, 30m otherwise
    const timer = setInterval(async () => {
      console.log('⏰ [TriggerManager] Running scheduled periodic qualification check...');
      await this.triggerQualification({
        reason: 'Scheduled periodic qualification check',
        triggerSource: 'SCHEDULE',
        correlationId: `sched-${crypto.randomUUID().slice(0, 6)}`,
        priority: 'LOW'
      });
    }, runIntervalMs);
    this.intervals.push(timer);
  }

  public stop(): void {
    console.log('⏰ [TriggerManager] Stopping trigger listeners...');
    // In practice, eventBus doesn't have an easy unsubscribe method directly exposed, but we can clear intervals
    for (const timer of this.intervals) {
      clearInterval(timer);
    }
    this.intervals = [];
    this.activeSubscriptions = [];
  }

  public async triggerManual(reason: string, scope?: string[], providerSelection?: string[]): Promise<any> {
    return this.triggerQualification({
      reason,
      triggerSource: 'MANUAL',
      correlationId: `manual-${crypto.randomUUID().slice(0, 6)}`,
      priority: 'HIGH',
      scope,
      providerSelection
    });
  }

  private async triggerQualification(params: Omit<QualificationRequest, 'id' | 'timestamp'>): Promise<any> {
    const request: QualificationRequest = {
      id: `qual-req-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      ...params
    };

    try {
      return await qualificationOrchestrator.executeRequest(request);
    } catch (err: unknown) {
      console.error('[TriggerManager] Failed executing qualification request:', err);
    }
  }

  private mapEventToScope(eventName: string): string[] {
    switch (eventName) {
      case 'CapabilityRegistered':
      case 'CapabilityUpdated':
        return ['capabilities'];
      case 'ConfigurationChanged':
        return ['governance', 'architecture'];
      case 'ModelChanged':
        return ['ai-runtime'];
      case 'DependencyUpdated':
        return ['dependencies'];
      default:
        return [];
    }
  }
}

export const triggerManager = new TriggerManager();
export default triggerManager;
