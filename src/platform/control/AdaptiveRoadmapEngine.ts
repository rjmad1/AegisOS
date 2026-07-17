// src/platform/control/AdaptiveRoadmapEngine.ts
import { PlatformState } from "./PlatformStateEngine";
import { EngineeringMetrics } from "./EngineeringOperationsCenter";
import { CorrelationFinding } from "./FeedbackCorrelationEngine";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  businessValue: number; // 1 - 10
  customerImpact: number; // 1 - 10
  engineeringEffort: number; // 1 - 10 (lower is easier)
  architecturalAlignment: number; // 1 - 10
  operationalRisk: number; // 1 - 10 (lower is safer)
  observedUsage: number; // 1 - 10 (dynamic from telemetry)
  priorityScore: number; // calculated
  originalRank: number;
  newRank: number;
  repositionNotes: string;
}

export interface AdaptiveRoadmapData {
  items: RoadmapItem[];
  recommendsReprioritization: boolean;
  explanation: string;
}

export class AdaptiveRoadmapEngine {
  private static instance: AdaptiveRoadmapEngine | null = null;

  private constructor() {}

  public static getInstance(): AdaptiveRoadmapEngine {
    if (!AdaptiveRoadmapEngine.instance) {
      AdaptiveRoadmapEngine.instance = new AdaptiveRoadmapEngine();
    }
    return AdaptiveRoadmapEngine.instance;
  }

  /**
   * Evaluates telemetry, engineering metrics, and correlations to dynamically reprioritize the platform roadmap.
   */
  public async calculateAdaptiveRoadmap(
    state: PlatformState,
    engineering: EngineeringMetrics,
    findings: CorrelationFinding[]
  ): Promise<AdaptiveRoadmapData> {
    
    // 1. Define baseline roadmap items
    const baseItems: Omit<RoadmapItem, "priorityScore" | "originalRank" | "newRank" | "repositionNotes">[] = [
      {
        id: "road-zt-pairing",
        title: "Zero-Trust Secure Pairing Enclave Hooks",
        description: "Incorporate Secure Enclave hardware attestation keys into client handshake verification steps.",
        businessValue: 9,
        customerImpact: 9,
        engineeringEffort: 5,
        architecturalAlignment: 10,
        operationalRisk: 3,
        observedUsage: state.overallStatus === "healthy" ? 8 : 4
      },
      {
        id: "road-pg-mig",
        title: "Scale SQLite Persistence to PostgreSQL Container",
        description: "Migrate multi-tenant relational persistence to a PostgreSQL container to prevent transaction queue timeouts.",
        businessValue: 8,
        customerImpact: 7,
        engineeringEffort: 6,
        architecturalAlignment: 9,
        operationalRisk: 5,
        observedUsage: state.health.databaseSizeMb > 6.0 ? 9 : 4
      },
      {
        id: "road-slm-tune",
        title: "Sovereign 1.5B/3B SLM Fine-Tuning Integration",
        description: "Integrate specialized local Small Language Models to handle simple assistant requests, bypassing deep LLMs.",
        businessValue: 9,
        customerImpact: 8,
        engineeringEffort: 7,
        architecturalAlignment: 8,
        operationalRisk: 4,
        observedUsage: state.capacity.avgLatencyMs > 450 ? 8 : 5
      },
      {
        id: "road-auto-heal",
        title: "Automated Self-Healing mitigation loop controls",
        description: "Deploy automated recovery triggers to reboot failed Ollama/LiteLLM server ports.",
        businessValue: 8,
        customerImpact: 9,
        engineeringEffort: 4,
        architecturalAlignment: 8,
        operationalRisk: 3,
        observedUsage: state.health.ports.some(p => p.status === "offline") ? 10 : 3
      },
      {
        id: "road-sbom-auto",
        title: "Automated CycloneDX SBOM Tag Releases",
        description: "Integrate compliance checks compiling dependency SBOM JSON files into automated GitHub tag releases.",
        businessValue: 6,
        customerImpact: 5,
        engineeringEffort: 3,
        architecturalAlignment: 9,
        operationalRisk: 2,
        observedUsage: state.dependencies.lockStatus === "invalid" ? 9 : 2
      },
      {
        id: "road-todo-cleanup",
        title: "Dedicated Technical Debt Burndown Cycle",
        description: "Plan a cleanup cycle to resolve codebase TODO markers, reducing developers' context-switching drag.",
        businessValue: 5,
        customerImpact: 4,
        engineeringEffort: 3,
        architecturalAlignment: 9,
        operationalRisk: 2,
        observedUsage: engineering.technicalDebtTodoCount > 10 ? 8 : 3
      }
    ];

    // 2. Establish original sorting based on baseline weights (without observed usage)
    const originalScores = baseItems.map((item) => {
      // originalScore = (BusinessValue * 0.25) + (Impact * 0.25) + (Align * 0.2) - (Effort * 0.15) - (Risk * 0.15)
      const score = parseFloat((
        item.businessValue * 0.25 +
        item.customerImpact * 0.25 +
        item.architecturalAlignment * 0.2 -
        item.engineeringEffort * 0.15 -
        item.operationalRisk * 0.15
      ).toFixed(2));
      return { id: item.id, score };
    });
    originalScores.sort((a, b) => b.score - a.score);
    const originalRanks = new Map<string, number>();
    originalScores.forEach((s, idx) => {
      originalRanks.set(s.id, idx + 1);
    });

    // 3. Apply telemetry modifications based on observed correlations and risks
    const reprioritized: RoadmapItem[] = baseItems.map((item) => {
      let finalBusinessValue = item.businessValue;
      let finalCustomerImpact = item.customerImpact;
      let finalOperationalRisk = item.operationalRisk;
      let notes: string[] = [];

      // Telemetry modification logic
      if (item.id === "road-pg-mig") {
        if (state.health.databaseSizeMb > 8.0) {
          finalBusinessValue += 2.0;
          finalCustomerImpact += 1.0;
          notes.push(`SQLite size (${state.health.databaseSizeMb}MB) is approaching the 10MB limit. Elevated priority to avoid database transaction locks.`);
        } else if (findings.some(f => f.id === "corr-db-lockout")) {
          finalBusinessValue += 1.5;
          notes.push("Correlated workflow timeout incidents detected. Elevated SQLite database migration priority.");
        }
      }

      if (item.id === "road-slm-tune") {
        if (state.capacity.avgLatencyMs > 500) {
          finalCustomerImpact += 1.5;
          notes.push(`Average response latency is high (${state.capacity.avgLatencyMs}ms). Elevated priority to route short prompts to localized 1.5B/3B weights.`);
        }
      }

      if (item.id === "road-auto-heal") {
        const offlinePorts = state.health.ports.filter(p => p.status === "offline");
        if (offlinePorts.length > 0) {
          finalBusinessValue += 2.0;
          finalCustomerImpact += 1.5;
          notes.push(`Operational Alert: service ports (${offlinePorts.map(p => p.port).join(", ")}) are offline. Elevated automated self-healing loops to mitigate downtime.`);
        }
      }

      if (item.id === "road-sbom-auto") {
        if (state.dependencies.lockStatus === "invalid") {
          finalBusinessValue += 2.0;
          notes.push("NIST supply chain compliance gate is currently blocked (CycloneDX SBOM file missing). Elevated to restore release readiness.");
        }
      }

      if (item.id === "road-todo-cleanup") {
        if (engineering.technicalDebtTodoCount > 10) {
          finalBusinessValue += 1.5;
          notes.push(`Found ${engineering.technicalDebtTodoCount} pending TODOs, introducing developer drag. Elevated cleanup to improve velocity.`);
        }
      }

      // Calculate Priority Score with observed usage included:
      // PriorityScore = (BusinessValue * 0.2) + (Impact * 0.2) + (Align * 0.15) + (ObservedUsage * 0.25) - (Effort * 0.1) - (Risk * 0.1)
      const priorityScore = parseFloat((
        finalBusinessValue * 0.2 +
        finalCustomerImpact * 0.2 +
        item.architecturalAlignment * 0.15 +
        item.observedUsage * 0.25 -
        item.engineeringEffort * 0.1 -
        finalOperationalRisk * 0.1
      ).toFixed(2));

      return {
        ...item,
        businessValue: finalBusinessValue,
        customerImpact: finalCustomerImpact,
        operationalRisk: finalOperationalRisk,
        priorityScore,
        originalRank: originalRanks.get(item.id) || 1,
        newRank: 0, // calculated below
        repositionNotes: notes.length > 0 ? notes.join(" ") : "Maintained nominal baseline priority."
      };
    });

    // Sort by priority score descending
    reprioritized.sort((a, b) => b.priorityScore - a.priorityScore);
    reprioritized.forEach((item, idx) => {
      item.newRank = idx + 1;
    });

    // Determine if reprioritization recommendations should trigger
    let recommendsReprioritization = false;
    let explanation = "Roadmap priorities remain aligned with strategic baselines.";

    const shifts = reprioritized.filter(item => item.originalRank !== item.newRank);
    if (shifts.length > 0) {
      recommendsReprioritization = true;
      const topShift = shifts[0];
      const direction = topShift.newRank < topShift.originalRank ? "up" : "down";
      explanation = `Observed telemetry indicates a priority shift. '${topShift.title}' moved ${direction} from rank #${topShift.originalRank} to #${topShift.newRank} due to operational evidence: ${topShift.repositionNotes}`;
    }

    return {
      items: reprioritized,
      recommendsReprioritization,
      explanation
    };
  }
}

export const adaptiveRoadmapEngine = AdaptiveRoadmapEngine.getInstance();
export default adaptiveRoadmapEngine;
