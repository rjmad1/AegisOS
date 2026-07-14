import { IntentResult, EntityResult } from "./types";

export class IntentClassifier {
  private static instance: IntentClassifier | null = null;

  private constructor() {}

  public static getInstance(): IntentClassifier {
    if (!IntentClassifier.instance) {
      IntentClassifier.instance = new IntentClassifier();
    }
    return IntentClassifier.instance;
  }

  /**
   * Classifies user prompts and extracts entity arguments.
   */
  public classify(prompt: string): { intent: IntentResult; entities: EntityResult[] } {
    const cleaned = prompt.toLowerCase().trim();
    const entities: EntityResult[] = [];

    // 1. service_control
    if (cleaned.includes("restart") || cleaned.includes("stop") || cleaned.includes("start")) {
      let action = "restart";
      if (cleaned.includes("stop")) action = "stop";
      else if (cleaned.includes("restart")) action = "restart";
      else if (cleaned.includes("start")) action = "start";
      entities.push({ name: "action", value: action });

      let serviceName = "ollama";
      if (cleaned.includes("redis")) serviceName = "redis";
      if (cleaned.includes("litellm")) serviceName = "litellm";
      if (cleaned.includes("postgres")) serviceName = "postgres";
      entities.push({ name: "serviceId", value: serviceName });

      return {
        intent: { name: "service_control", confidence: 0.95 },
        entities,
      };
    }

    // 2. model_management
    if (
      cleaned.includes("download") || 
      cleaned.includes("load") || 
      cleaned.includes("unload") || 
      cleaned.includes("update") || 
      cleaned.includes("switch")
    ) {
      let action = "load";
      if (cleaned.includes("unload")) action = "unload";
      if (cleaned.includes("download")) action = "download";
      if (cleaned.includes("update")) action = "update";
      entities.push({ name: "action", value: action });

      let modelId = "ollama:gemma2:9b";
      if (cleaned.includes("llama")) modelId = "ollama:llama3.1:8b";
      if (cleaned.includes("gpt-4o")) modelId = "litellm:gpt-4o";
      entities.push({ name: "modelId", value: modelId });

      return {
        intent: { name: "model_management", confidence: 0.92 },
        entities,
      };
    }

    // 3. telemetry_view
    if (cleaned.includes("show") && (cleaned.includes("usage") || cleaned.includes("status") || cleaned.includes("telemetry"))) {
      let metric = "cpu";
      if (cleaned.includes("gpu")) metric = "gpu";
      if (cleaned.includes("memory")) metric = "memory";
      entities.push({ name: "metric", value: metric });

      return {
        intent: { name: "telemetry_view", confidence: 0.9 },
        entities,
      };
    }

    // 4. agent_control
    if (cleaned.includes("agent") && (cleaned.includes("pause") || cleaned.includes("start") || cleaned.includes("terminate") || cleaned.includes("resume"))) {
      let action = "pause";
      if (cleaned.includes("start")) action = "start";
      if (cleaned.includes("terminate")) action = "terminate";
      if (cleaned.includes("resume")) action = "resume";
      entities.push({ name: "action", value: action });
      entities.push({ name: "agentId", value: "all" });

      return {
        intent: { name: "agent_control", confidence: 0.94 },
        entities,
      };
    }

    // 5. knowledge_control
    if (cleaned.includes("knowledge") || cleaned.includes("reindex") || cleaned.includes("embeddings")) {
      entities.push({ name: "action", value: "refresh" });
      return {
        intent: { name: "knowledge_control", confidence: 0.88 },
        entities,
      };
    }

    // 6. system_backup
    if (cleaned.includes("backup") || cleaned.includes("checkpoint")) {
      entities.push({ name: "action", value: "backup" });
      return {
        intent: { name: "system_backup", confidence: 0.96 },
        entities,
      };
    }

    // 7. explain_telemetry
    if (cleaned.includes("explain") || cleaned.includes("why is")) {
      let metric = "memory";
      if (cleaned.includes("cpu")) metric = "cpu";
      if (cleaned.includes("gpu")) metric = "gpu";
      entities.push({ name: "metric", value: metric });

      return {
        intent: { name: "explain_telemetry", confidence: 0.85 },
        entities,
      };
    }

    // 8. general_chat
    return {
      intent: { name: "general_chat", confidence: 0.8 },
      entities,
    };
  }
}

export const intentClassifier = IntentClassifier.getInstance();
