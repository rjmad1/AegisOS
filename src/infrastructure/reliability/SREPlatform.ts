import { reliabilityStore } from "./store";

export interface SreService {
  id: string;
  name: string;
  owner: string;
  tier: "Tier-0" | "Tier-1" | "Tier-2";
  sli: {
    availability: number;
    latencyP95: number;
  };
  slo: {
    availabilityTarget: number; // e.g. 99.9
    latencyTargetMs: number; // e.g. 200
  };
  sla: {
    availabilityTarget: number; // e.g. 99.0
    remediationTimeHours: number;
  };
  errorBudget: {
    totalAllowedErrors: number;
    remainingErrors: number;
    burnRate: number; // e.g. 1.0 (normal) or higher (alerting)
  };
}

export class SREPlatform {
  private static instance: SREPlatform | null = null;
  private services: Map<string, SreService> = new Map();

  private constructor() {
    this.initializeServiceCatalog();
  }

  public static getInstance(): SREPlatform {
    if (!SREPlatform.instance) {
      SREPlatform.instance = new SREPlatform();
    }
    return SREPlatform.instance;
  }

  private initializeServiceCatalog() {
    const catalog: SreService[] = [
      {
        id: "ollama",
        name: "Ollama Model Server",
        owner: "AI Infra Team",
        tier: "Tier-0",
        sli: { availability: 99.85, latencyP95: 180 },
        slo: { availabilityTarget: 99.9, latencyTargetMs: 250 },
        sla: { availabilityTarget: 99.0, remediationTimeHours: 2 },
        errorBudget: { totalAllowedErrors: 142, remainingErrors: 120, burnRate: 0.9 }
      },
      {
        id: "litellm",
        name: "LiteLLM Router",
        owner: "AI Routing Team",
        tier: "Tier-0",
        sli: { availability: 99.92, latencyP95: 45 },
        slo: { availabilityTarget: 99.95, latencyTargetMs: 80 },
        sla: { availabilityTarget: 99.5, remediationTimeHours: 1 },
        errorBudget: { totalAllowedErrors: 71, remainingErrors: 60, burnRate: 1.1 }
      },
      {
        id: "database",
        name: "Prisma Database",
        owner: "Data Platform Team",
        tier: "Tier-0",
        sli: { availability: 100.0, latencyP95: 5 },
        slo: { availabilityTarget: 99.99, latencyTargetMs: 15 },
        sla: { availabilityTarget: 99.9, remediationTimeHours: 0.5 },
        errorBudget: { totalAllowedErrors: 14, remainingErrors: 14, burnRate: 0.0 }
      },
      {
        id: "openclaw",
        name: "OpenClaw Gateway",
        owner: "Agent Platform Team",
        tier: "Tier-1",
        sli: { availability: 99.78, latencyP95: 120 },
        slo: { availabilityTarget: 99.9, latencyTargetMs: 150 },
        sla: { availabilityTarget: 99.0, remediationTimeHours: 4 },
        errorBudget: { totalAllowedErrors: 142, remainingErrors: 98, burnRate: 1.6 }
      },
      {
        id: "redis",
        name: "Redis Cache Platform",
        owner: "Ops Infra Team",
        tier: "Tier-1",
        sli: { availability: 99.99, latencyP95: 2 },
        slo: { availabilityTarget: 99.99, latencyTargetMs: 5 },
        sla: { availabilityTarget: 99.0, remediationTimeHours: 2 },
        errorBudget: { totalAllowedErrors: 14, remainingErrors: 13, burnRate: 0.5 }
      },
      {
        id: "workers",
        name: "Background Job Workers",
        owner: "Compute Platform Team",
        tier: "Tier-2",
        sli: { availability: 99.5, latencyP95: 450 },
        slo: { availabilityTarget: 99.0, latencyTargetMs: 1000 },
        sla: { availabilityTarget: 95.0, remediationTimeHours: 8 },
        errorBudget: { totalAllowedErrors: 1420, remainingErrors: 1100, burnRate: 0.8 }
      }
    ];

    for (const svc of catalog) {
      this.services.set(svc.id, svc);
    }
  }

  public getServices(): SreService[] {
    // Merge dynamically with local stores metrics
    const list: SreService[] = [];
    const storeMetrics = reliabilityStore.getState().sloMetrics;

    for (const [id, service] of this.services.entries()) {
      if (id === "litellm") {
        const errorPercent = storeMetrics.totalRequestsCount > 0 
          ? (storeMetrics.errorCount / storeMetrics.totalRequestsCount) * 100 
          : 0;
        const availability = Math.max(100 - errorPercent, 0);
        list.push({
          ...service,
          sli: {
            ...service.sli,
            availability: parseFloat(availability.toFixed(4))
          }
        });
      } else {
        list.push(service);
      }
    }
    return list;
  }

  public recordRequest(serviceId: string, latencyMs: number, isError: boolean) {
    reliabilityStore.update((state) => {
      state.sloMetrics.totalRequestsCount++;
      if (isError) {
        state.sloMetrics.errorCount++;
      }
    });

    const service = this.services.get(serviceId);
    if (service) {
      const budget = service.errorBudget;
      if (isError) {
        budget.remainingErrors = Math.max(budget.remainingErrors - 1, 0);
      }
      // Calculate a moving burn rate
      budget.burnRate = isError ? 2.5 : Math.max(budget.burnRate - 0.05, 0.5);
      this.services.set(serviceId, service);
    }
  }

  public getSloReport() {
    const services = this.getServices();
    const totalSlo = services.length;
    const metSlo = services.filter(s => s.sli.availability >= s.slo.availabilityTarget).length;
    const metSla = services.filter(s => s.sli.availability >= s.sla.availabilityTarget).length;

    return {
      timestamp: new Date().toISOString(),
      overallSloCompliance: parseFloat(((metSlo / totalSlo) * 100).toFixed(2)),
      overallSlaCompliance: parseFloat(((metSla / totalSlo) * 100).toFixed(2)),
      services
    };
  }
}

export const srePlatform = SREPlatform.getInstance();
export default srePlatform;
