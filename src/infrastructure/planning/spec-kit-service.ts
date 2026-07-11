import * as fs from "fs";
import * as path from "path";

export interface SpecAnalysis {
  consistent: boolean;
  warnings: string[];
  auditedAt: string;
}

export class SpecKitService {
  private static instance: SpecKitService | null = null;

  private constructor() {}

  public static getInstance(): SpecKitService {
    if (!SpecKitService.instance) {
      SpecKitService.instance = new SpecKitService();
    }
    return SpecKitService.instance;
  }

  // Generate specification structures conforming to standard
  public generateTemplate(
    type: "prd" | "adr" | "criteria" | "implementation" | "traceability",
    inputs: Record<string, string>
  ): string {
    const title = inputs.title || "Untitled Specification";
    const date = new Date().toISOString().split("T")[0];

    switch (type) {
      case "prd":
        return `# PRD: ${title}\n\n## 1. Goal & Objectives\n${inputs.goals || "Specify primary business and operational targets."}\n\n## 2. Scope & Boundaries\n- Included: ${inputs.inScope || "TBD"}\n- Excluded: ${inputs.outScope || "TBD"}\n\n## 3. User Stories\n- User Story 1: As a user, I want... so that...\n\n## 4. Technical Constraints\n- Loopback binding constraint\n- VRAM limits`;
        
      case "adr":
        return `# ADR: ${title}\n\n## Status\nProposed\n\n## Date\n${date}\n\n## Context\n${inputs.context || "Describe problem context."}\n\n## Decision\n${inputs.decision || "State architectural choice."}\n\n## Consequences\n- Pros: TBD\n- Cons: TBD`;

      case "criteria":
        return `# Acceptance Criteria: ${title}\n\n- [ ] AC-1: Functional correctness verified by tests\n- [ ] AC-2: Latency is within acceptable threshold (<200ms)\n- [ ] AC-3: No security warnings during scans`;

      case "implementation":
        return `# Implementation Plan: ${title}\n\n## Proposed Changes\n- File changes mapped\n- Dependencies updated\n\n## Verification\n- Automated test commands\n- Manual validation run`;

      case "traceability":
        return `# Traceability Matrix: ${title}\n\n| Req ID | Target Module | Test Case ID | Status |\n|---|---|---|---|\n| REQ-01 | src/infrastructure/ | tc-validation-01 | ✅ Verified |\n| REQ-02 | src/services/ | tc-validation-02 | ✅ Verified |`;
    }
  }

  // Audits consistency of a design block
  public auditSpecification(content: string): SpecAnalysis {
    const warnings: string[] = [];
    
    // Check for standard SDD markers
    if (!content.includes("#")) {
      warnings.push("Missing document title hierarchy (no H1 found).");
    }
    
    // Check for VRAM or security concerns if architectural
    if (content.toLowerCase().includes("adr") && !content.toLowerCase().includes("consequences")) {
      warnings.push("ADR template is missing a required 'Consequences' section.");
    }
    
    if (content.toLowerCase().includes("prd") && !content.toLowerCase().includes("scope")) {
      warnings.push("PRD document is missing a 'Scope & Boundaries' specification.");
    }

    return {
      consistent: warnings.length === 0,
      warnings,
      auditedAt: new Date().toISOString()
    };
  }
}

export const specKitService = SpecKitService.getInstance();
export default specKitService;
