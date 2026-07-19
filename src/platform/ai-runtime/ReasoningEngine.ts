import { ThoughtNode } from "./types";

export interface IReasoningProvider {
  id: string;
  generateText(prompt: string, context?: Record<string, any>): Promise<string>;
  evaluateConfidence(prompt: string): Promise<number>;
}

export class ReasoningEngine {
  private static instance: ReasoningEngine | null = null;
  private provider: IReasoningProvider | null = null;

  private constructor() {}

  public static getInstance(): ReasoningEngine {
    if (!ReasoningEngine.instance) {
      ReasoningEngine.instance = new ReasoningEngine();
    }
    return ReasoningEngine.instance;
  }

  public registerProvider(provider: IReasoningProvider): void {
    this.provider = provider;
    console.log(`[ReasoningEngine] Registered reasoning provider: ${provider.id}`);
  }

  private getProvider(): IReasoningProvider {
    if (!this.provider) throw new Error("No reasoning provider registered");
    return this.provider;
  }

  /**
   * Provider-Agnostic Tree of Thought (ToT)
   */
  public async treeOfThought(problem: string, depth: number = 3): Promise<{ finalThought: string; tree: ThoughtNode[] }> {
    console.log(`[ReasoningEngine:ToT] Initializing Tree of Thought via ${this.provider?.id || 'mock'}...`);
    
    const provider = this.getProvider();
    const tree: ThoughtNode[] = [];

    const root: ThoughtNode = {
      id: "thought:root",
      thought: `Root problem: ${problem}`,
      confidence: 1.0,
      evaluationScore: 1.0,
    };
    tree.push(root);

    let currentParentId = root.id;

    for (let d = 1; d <= depth; d++) {
      // In a real implementation, we would query the provider for 3 distinct alternative approaches
      const thoughts: ThoughtNode[] = [
        {
          id: `thought:d${d}:alt1`,
          thought: await provider.generateText(`Generate approach A for ${problem} at depth ${d}`),
          confidence: await provider.evaluateConfidence("approach A"),
          parentThoughtId: currentParentId,
          evaluationScore: 0.8,
        },
        {
          id: `thought:d${d}:alt2`,
          thought: await provider.generateText(`Generate approach B for ${problem} at depth ${d}`),
          confidence: await provider.evaluateConfidence("approach B"),
          parentThoughtId: currentParentId,
          evaluationScore: 0.95,
        }
      ];

      tree.push(...thoughts);

      const best = thoughts.sort((a, b) => b.evaluationScore! - a.evaluationScore!)[0];
      currentParentId = best.id;
    }

    const finalNode = tree.find((t) => t.id === currentParentId)!;
    return {
      finalThought: finalNode.thought,
      tree,
    };
  }

  /**
   * Reflection via provider
   */
  public async reflect(draft: string): Promise<{ critique: string; refined: string }> {
    const provider = this.getProvider();
    const critique = await provider.generateText(`Critique this draft: ${draft}`);
    const refined = await provider.generateText(`Refine this draft based on the critique: ${critique}`);
    
    return { critique, refined };
  }
}
export default ReasoningEngine;
