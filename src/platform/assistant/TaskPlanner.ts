import { IntentResult, EntityResult, ExecutionPlan, PlanStep } from "./types";

export class TaskPlanner {
  private static instance: TaskPlanner | null = null;

  private constructor() {}

  public static getInstance(): TaskPlanner {
    if (!TaskPlanner.instance) {
      TaskPlanner.instance = new TaskPlanner();
    }
    return TaskPlanner.instance;
  }

  /**
   * Generates a structural execution plan preview based on intent and entities.
   */
  public generatePlan(intent: IntentResult, entities: EntityResult[]): ExecutionPlan {
    const steps: PlanStep[] = [];
    const entityMap = new Map(entities.map((e) => [e.name, e.value]));

    switch (intent.name) {
      case "service_control": {
        const serviceId = entityMap.get("serviceId") || "ollama";
        const action = entityMap.get("action") || "restart";
        let commandType = "infrastructure:restart_service";
        let description = `Restart service ${serviceId}`;

        if (action === "stop") {
          commandType = "infrastructure:stop_service";
          description = `Stop service ${serviceId}`;
        } else if (action === "start") {
          commandType = "infrastructure:start_service";
          description = `Start service ${serviceId}`;
        }

        steps.push({
          description,
          commandType,
          payload: { serviceId },
          estimatedDurationMs: 2000,
          riskLevel: "MEDIUM",
        });
        break;
      }

      case "model_management": {
        const modelId = entityMap.get("modelId") || "ollama:gemma2:9b";
        const action = entityMap.get("action") || "load";
        let commandType = "ai:load_model";
        let description = `Load model weights ${modelId}`;

        if (action === "unload") {
          commandType = "ai:unload_model";
          description = `Unload model weights ${modelId}`;
        }

        steps.push({
          description,
          commandType,
          payload: { modelId },
          estimatedDurationMs: 3000,
          riskLevel: "LOW",
        });
        break;
      }

      case "agent_control": {
        const agentId = entityMap.get("agentId") || "all";
        const action = entityMap.get("action") || "pause";
        let commandType = "agent:pause";
        let description = `Pause active AI agent sessions`;
        let riskLevel: "LOW" | "MEDIUM" = "LOW";

        if (action === "resume") {
          commandType = "agent:resume";
          description = `Resume paused AI agent sessions`;
        } else if (action === "terminate") {
          commandType = "agent:terminate";
          description = `Terminate running AI agent sessions`;
          riskLevel = "MEDIUM";
        }

        steps.push({
          description,
          commandType,
          payload: { agentId },
          estimatedDurationMs: 1000,
          riskLevel,
        });
        break;
      }

      case "knowledge_control": {
        steps.push({
          description: "Refresh index database embeddings",
          commandType: "knowledge:refresh_embeddings",
          payload: {},
          estimatedDurationMs: 5000,
          riskLevel: "LOW",
        });
        break;
      }

      case "system_backup": {
        steps.push({
          description: "Create backup archive for workstation database state",
          commandType: "system:backup",
          payload: {},
          estimatedDurationMs: 4000,
          riskLevel: "MEDIUM",
        });
        break;
      }

      default:
        // telemetry_view, explain_telemetry, or general_chat do not mutate host, 0 steps
        break;
    }

    // Determine overall characteristics
    const totalDurationMs = steps.reduce((sum, s) => sum + s.estimatedDurationMs, 0);
    
    // Max risk check
    let overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    for (const step of steps) {
      if (step.riskLevel === "CRITICAL") overallRisk = "CRITICAL";
      else if (step.riskLevel === "HIGH" && overallRisk !== "CRITICAL") overallRisk = "HIGH";
      else if (step.riskLevel === "MEDIUM" && overallRisk !== "CRITICAL" && overallRisk !== "HIGH") overallRisk = "MEDIUM";
    }

    // Rollback availability check
    const rollbackAvailable = steps.length > 0 && steps.every((s) => 
      s.commandType.startsWith("infrastructure:") ||
      s.commandType.startsWith("ai:") ||
      s.commandType.startsWith("agent:")
    );

    // Approval requirement check (Medium, High, or Critical risk)
    const approvalRequired = overallRisk === "MEDIUM" || overallRisk === "HIGH" || overallRisk === "CRITICAL";

    return {
      steps,
      totalDurationMs,
      overallRisk,
      rollbackAvailable,
      approvalRequired,
    };
  }
}

export const taskPlanner = TaskPlanner.getInstance();
