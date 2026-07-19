
export interface RemediationSuggestion {
  rule: string;
  sourceFile?: string;
  explanation: string;
  recommendedPattern: string;
  candidatePatch?: string;
}

export class ArchitectureAutoRemediator {
  private static instance: ArchitectureAutoRemediator | null = null;

  private constructor() {}

  public static getInstance(): ArchitectureAutoRemediator {
    if (!ArchitectureAutoRemediator.instance) {
      ArchitectureAutoRemediator.instance = new ArchitectureAutoRemediator();
    }
    return ArchitectureAutoRemediator.instance;
  }

  public analyzeViolations(violations: any[]): RemediationSuggestion[] {
    const suggestions: RemediationSuggestion[] = [];

    for (const v of violations) {
      if (typeof v === "string") {
        if (v.includes("Direct infrastructure import bypasses Platform SDK facade")) {
          const file = v.split(":")[0];
          suggestions.push({
            rule: "Platform Layering",
            sourceFile: file,
            explanation: "Direct infrastructure imports in the presentation/UI layer break the layered architecture.",
            recommendedPattern: "Platform SDK Facade",
            candidatePatch: "Change `import { X } from \"@/infrastructure/...\"` to `import { X } from \"@/infrastructure/sdk/platform-sdk\"`."
          });
        } else if (v.includes("View layer imports raw database repository")) {
          const file = v.split(":")[0];
          suggestions.push({
            rule: "Repository Boundary",
            sourceFile: file,
            explanation: "Repositories contain persistence logic which should not leak to the presentation or API routes.",
            recommendedPattern: "Application Service Layer",
            candidatePatch: "Create a Service (e.g. `src/services/admin.service.ts`) and import it instead of the repository."
          });
        } else if (v.includes("Kernel boundary violation")) {
          const file = v.split(":")[0];
          suggestions.push({
            rule: "Kernel Boundary",
            sourceFile: file,
            explanation: "Kernel modules manage platform boot and memory spaces, which are highly privileged.",
            recommendedPattern: "Client SDK or Proxy",
            candidatePatch: "Use `clientPlatformSdk` or similar APIs exposed for client usage."
          });
        }
      }
    }
    
    return suggestions;
  }
}

export const architectureAutoRemediator = ArchitectureAutoRemediator.getInstance();

