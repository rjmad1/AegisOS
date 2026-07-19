import { 
  CognitiveArtifact, 
  DeliberationContext, 
  DeliberationResult, 
  ReasoningStrategyType 
} from "./types";
import { randomUUID } from "node:crypto";

/**
 * Interface that all reasoning strategies must implement.
 * This ensures they are perfectly interchangeable.
 */
export interface IReasoningStrategy {
  readonly type: ReasoningStrategyType;
  deliberate(context: DeliberationContext): Promise<DeliberationResult>;
}

/**
 * Deliberation Service
 * 
 * Supports multiple reasoning strategies and allows them to be swapped.
 * It never executes workflows, it merely performs deliberation (thought processes).
 */
export class DeliberationService {
  private strategies: Map<ReasoningStrategyType, IReasoningStrategy> = new Map();

  public registerStrategy(strategy: IReasoningStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  public getSupportedStrategies(): ReasoningStrategyType[] {
    return Array.from(this.strategies.keys());
  }

  public async deliberate(
    objective: string,
    strategyType: ReasoningStrategyType,
    contextArgs?: Partial<DeliberationContext>
  ): Promise<DeliberationResult> {
    const strategy = this.strategies.get(strategyType);
    if (!strategy) {
      throw new Error(`DeliberationService: Strategy '${strategyType}' is not registered. Cannot deliberate.`);
    }

    const context: DeliberationContext = {
      objective,
      ...contextArgs,
    };

    return strategy.deliberate(context);
  }
}

// ---------------------------------------------------------------------------
// Example Default Strategy Implementations
// ---------------------------------------------------------------------------

export class ChainOfThoughtStrategy implements IReasoningStrategy {
  public readonly type: ReasoningStrategyType = "chain_of_thought";

  public async deliberate(context: DeliberationContext): Promise<DeliberationResult> {
    // In a real implementation, this would orchestrate LLM calls using the prompt templates
    // and memory context. Here we define the deterministic boundary.
    
    return {
      id: randomUUID(),
      type: "deliberation_result",
      createdAt: new Date().toISOString(),
      createdBy: "cil:deliberation:chain_of_thought",
      strategyUsed: this.type,
      conclusion: `Conclusion reached for objective: ${context.objective}`,
      reasoningTrace: [
        "1. Analyzed the objective.",
        "2. Formulated a step-by-step logical sequence.",
        "3. Reached conclusion."
      ],
      confidence: {
        confidenceScore: 0.85,
        reasoningCompleteness: 0.9,
        evidenceCoverage: 0.8,
        uncertaintyLevel: "low",
        riskLevel: "low",
        assumptionCount: 1,
        informationGaps: []
      }
    };
  }
}
