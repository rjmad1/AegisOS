import { ExecutionPlan } from "./types";

export class SafetyValidator {
  private static instance: SafetyValidator | null = null;

  private constructor() {}

  public static getInstance(): SafetyValidator {
    if (!SafetyValidator.instance) {
      SafetyValidator.instance = new SafetyValidator();
    }
    return SafetyValidator.instance;
  }

  /**
   * Scans user prompt for injection patterns or dangerous escape prompts.
   */
  public validatePrompt(prompt: string): { safe: boolean; reason?: string } {
    const cleaned = prompt.toLowerCase();
    
    const blockList = [
      "ignore previous instructions",
      "ignore the policies",
      "bypass the command bus",
      "bypass command bus",
      "execute directly",
      "run raw shell",
      "sudo rm",
      "format c:",
      "delete database",
    ];

    for (const phrase of blockList) {
      if (cleaned.includes(phrase)) {
        return {
          safe: false,
          reason: `Prompt contains blocked safety boundary violation phrase: "${phrase}".`,
        };
      }
    }

    return { safe: true };
  }

  /**
   * Checks execution plans for safety violations.
   */
  public validatePlan(plan: ExecutionPlan): { valid: boolean; reason?: string } {
    // 1. Ensure all steps target mapped command types (no shell injections)
    const validPrefixes = ["infrastructure:", "ai:", "agent:", "knowledge:", "system:", "workflow:"];
    
    for (const step of plan.steps) {
      const isPrefixValid = validPrefixes.some((prefix) => step.commandType.startsWith(prefix));
      if (!isPrefixValid) {
        return {
          valid: false,
          reason: `Invalid command type "${step.commandType}". All executions must target registered Command Bus handlers.`,
        };
      }

      // Check empty payloads
      if (step.commandType === "ai:load_model" && !step.payload.modelId) {
        return {
          valid: false,
          reason: "Model management requires a valid modelId parameter.",
        };
      }
      if (step.commandType.startsWith("infrastructure:") && !step.payload.serviceId) {
        return {
          valid: false,
          reason: "Service control requires a valid serviceId parameter.",
        };
      }
    }

    return { valid: true };
  }
}

export const safetyValidator = SafetyValidator.getInstance();
