import { promptVersioning } from "../registry/prompt-versioning";

export interface PromptOptimizationDraft {
  promptName: string;
  originalVersion: number;
  originalContent: string;
  optimizedContent: string;
  expectedGainPercent: number;
  status: "draft" | "approved" | "rejected";
}

export class SkillOptService {
  private static instance: SkillOptService | null = null;
  private drafts: Map<string, PromptOptimizationDraft> = new Map();

  private constructor() {}

  public static getInstance(): SkillOptService {
    if (!SkillOptService.instance) {
      SkillOptService.instance = new SkillOptService();
    }
    return SkillOptService.instance;
  }

  // Simulate offline prompt optimization loops (Phase 7)
  public async optimizePrompt(name: string): Promise<PromptOptimizationDraft | null> {
    const original = promptVersioning.listTemplates().find((t) => t.name === name);
    if (!original) return null;

    const originalContent = promptVersioning.getPrompt(name) || "";
    
    // SkillOpt optimization heuristic simulations
    let optimizedContent = originalContent;
    if (name === "system-code-generation") {
      optimizedContent = `${originalContent}\nStrict Guidelines: Prefer type safety, clean code blocks, and standard standard library modules where applicable.`;
    } else {
      optimizedContent = `${originalContent}\nFocus: Highlight memory usage, VRAM thresholds, and dependency coupling bounds in reviews.`;
    }

    const draftId = `draft-${name}-${Date.now()}`;
    const draft: PromptOptimizationDraft = {
      promptName: name,
      originalVersion: original.activeVersion,
      originalContent,
      optimizedContent,
      expectedGainPercent: Math.floor(Math.random() * 15) + 5, // 5% to 20% estimated improvement
      status: "draft"
    };

    this.drafts.set(draftId, draft);
    console.log(`[SkillOpt] Created prompt optimization draft for "${name}" (Expected gain: +${draft.expectedGainPercent}%)`);
    return draft;
  }

  public approveDraft(draftId: string, author: string): boolean {
    const draft = this.drafts.get(draftId);
    if (!draft) return false;

    draft.status = "approved";
    // Promote draft to active template version in Registry
    promptVersioning.savePromptVersion(
      draft.promptName,
      draft.optimizedContent,
      author,
      `SkillOpt optimization auto-approved version (Estimated gain: +${draft.expectedGainPercent}%)`
    );

    this.drafts.delete(draftId);
    console.log(`[SkillOpt] Promoted approved optimized draft for "${draft.promptName}" to active registry.`);
    return true;
  }

  public listDrafts(): PromptOptimizationDraft[] {
    return Array.from(this.drafts.values());
  }
}

export const skillOptService = SkillOptService.getInstance();
export default skillOptService;
