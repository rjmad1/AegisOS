import { LiveOperationalTwin } from './LiveOperationalTwin';
import { HistoricalAnalyticsStore } from './HistoricalAnalyticsStore';
import { eventBus } from '../../event-bus/EventPlatform';

export class PlatformDigitalTwin {
  private static instance: PlatformDigitalTwin | null = null;
  
  public readonly live: LiveOperationalTwin;
  public readonly history: HistoricalAnalyticsStore;

  private constructor() {
    this.live = new LiveOperationalTwin();
    this.history = new HistoricalAnalyticsStore();
    this.initializeEventSubscriptions();
  }

  public static getInstance(): PlatformDigitalTwin {
    if (!PlatformDigitalTwin.instance) {
      PlatformDigitalTwin.instance = new PlatformDigitalTwin();
    }
    return PlatformDigitalTwin.instance;
  }

  /**
   * Syncs the Live Operational Twin with immutable events from the Kernel Event Bus.
   */
  private initializeEventSubscriptions(): void {
    eventBus.subscribe('participant:registered', (payload: any) => {
      this.live.upsertNode(payload.participantId, 'Participant', { type: payload.type });
    });

    eventBus.subscribe('participant:removed', (payload: any) => {
      this.live.removeNode(payload.participantId);
    });

    eventBus.subscribe('workflow:started', (payload: any) => {
      this.live.upsertNode(payload.workflowId, 'Workflow', { name: payload.name, status: 'running' });
      this.history.recordMetric('workflow.started', 1, { workflowId: payload.workflowId });
    });

    eventBus.subscribe('workflow:completed', (payload: any) => {
      this.live.upsertNode(payload.workflowId, 'Workflow', { status: payload.status });
      this.history.recordMetric('workflow.completed', 1, { status: payload.status });
    });

    eventBus.subscribe('capability:loaded', (payload: any) => {
      this.live.upsertNode(payload.capabilityId, 'Capability', { loaded: true });
    });

    eventBus.subscribe('capability:released', (payload: any) => {
      this.live.removeNode(payload.capabilityId);
    });
  }

  public getSnapshot() {
    return this.live.getSnapshot();
  }
}

export const platformTwin = PlatformDigitalTwin.getInstance();
export default platformTwin;
