import { policyEnforcer } from "./policy-enforcer";

export interface SafetyCheckResult {
  passed: boolean;
  sanitizedPrompt: string;
  reason?: string;
  confidenceScore: number;
}

export class SafetyFirewall {
  private static instance: SafetyFirewall | null = null;

  private constructor() {}

  public static getInstance(): SafetyFirewall {
    if (!SafetyFirewall.instance) {
      SafetyFirewall.instance = new SafetyFirewall();
    }
    return SafetyFirewall.instance;
  }

  // Intercept incoming prompt requests
  public inspectPrompt(prompt: string): SafetyCheckResult {
    if (!prompt) {
      return { passed: true, sanitizedPrompt: "", confidenceScore: 1.0 };
    }

    // 1. Check prompt injection jailbreaks
    const hasInjection = policyEnforcer.containsInjection(prompt);
    if (hasInjection) {
      return {
        passed: false,
        sanitizedPrompt: "[BLOCKED: Prompt Injection Jailbreak Detected]",
        reason: "Jailbreak signature matched prompt filter policy rules",
        confidenceScore: 0.0
      };
    }

    // 2. Scrub PII
    const sanitizedPrompt = policyEnforcer.maskPII(prompt);

    return {
      passed: true,
      sanitizedPrompt,
      confidenceScore: 0.98
    };
  }

  // Grounding and hallucination evaluation stub
  public validateOutput(output: string, groundingSources: string[]): { grounded: boolean; confidenceScore: number } {
    if (!output) return { grounded: true, confidenceScore: 1.0 };

    // Simple heuristic: check if output is overly brief or contains failure tokens
    const hasHallucinationSignals = ["as an ai,", "ignore earlier limits", "i don't have access"].some((sig) =>
      output.toLowerCase().includes(sig)
    );

    const confidenceScore = hasHallucinationSignals ? 0.4 : 0.92;

    return {
      grounded: !hasHallucinationSignals,
      confidenceScore
    };
  }
}

export const safetyFirewall = SafetyFirewall.getInstance();
export default safetyFirewall;
