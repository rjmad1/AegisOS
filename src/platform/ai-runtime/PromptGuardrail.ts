import { z } from "zod";

/**
 * PromptGuardrail (AIG-2026-001)
 * 
 * Enforces strict JSON Schema adherence on LLM outputs and 
 * prevents Data Exfiltration via strict prompt sanitization.
 */
export class PromptGuardrail {
  /**
   * Sanitizes the input prompt to prevent injection and leakages.
   */
  public static sanitizeInput(prompt: string): string {
    // 1. Basic redaction of potential API keys (e.g. sk-...)
    let sanitized = prompt.replace(/sk-[a-zA-Z0-9]{32,}/g, "[REDACTED_API_KEY]");

    // 2. Heuristic Dataset Tuning (Known Jailbreak Signatures)
    const knownJailbreaks = [
      /ignore (all )?previous instructions/i,
      /system override/i,
      /you are (now )?a bypass/i,
      /DAN/i, // Do Anything Now
      /simulate a hypothetical scenario where you don'?t have rules/i
    ];

    for (const pattern of knownJailbreaks) {
      if (pattern.test(sanitized)) {
        // Redact the jailbreak payload or replace the whole prompt
        sanitized = sanitized.replace(pattern, "[JAILBREAK_ATTEMPT_REDACTED]");
      }
    }

    return sanitized;
  }

  /**
   * Validates output string against a Zod schema.
   */
  public static validateOutputSchema<T>(output: string, schema: z.ZodSchema<T>): T {
    try {
      const parsed = JSON.parse(output);
      return schema.parse(parsed);
    } catch (error) {
      throw new Error(`Guardrail Validation Failed: LLM output did not adhere to required JSON schema. Error: ${error}`);
    }
  }

  /**
   * Scans output for protected paths to prevent exfiltration (AIR-003).
   */
  public static scanForExfiltration(output: string): void {
    const protectedPaths = ["/etc/passwd", "C:\\Windows\\System32", "C:\\Users\\"];
    for (const p of protectedPaths) {
      if (output.includes(p)) {
        throw new Error("Guardrail Validation Failed: Security violation. System path exposed in output.");
      }
    }
  }
}
