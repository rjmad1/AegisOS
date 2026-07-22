import { TokenEvent } from '@platform/shared-contracts';

export interface AgentContext {
  sessionId: string;
  correlationId: string;
  history?: any[];
}

export interface IAgent<TInput, TOutput> {
  name: string;
  execute(input: TInput, context: AgentContext): Promise<TOutput>;
}

export abstract class BaseAgent<TInput, TOutput> implements IAgent<TInput, TOutput> {
  abstract name: string;
  protected modelName: string = 'gpt-4o-mini';

  protected abstract buildPrompt(input: TInput, context: AgentContext): string;
  protected abstract parseResponse(llmResponse: string): TOutput;
  protected abstract fallback(input: TInput, error: Error): TOutput;

  async execute(input: TInput, context: AgentContext): Promise<TOutput> {
    const prompt = this.buildPrompt(input, context);
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        attempts++;
        // Simulate/Call LLM API with structured outputs
        const rawOutput = await this.callLlmApi(prompt);
        const result = this.parseResponse(rawOutput);

        // Record Token Metrics
        this.recordTokenMetrics(context, prompt.length / 4, rawOutput.length / 4);

        return result;
      } catch (err: any) {
        if (attempts >= maxRetries) {
          console.warn(`[Agent:${this.name}] Exhausted retries, executing fallback logic. Error: ${err.message}`);
          return this.fallback(input, err);
        }
        // Exponential backoff
        await new Promise((res) => setTimeout(res, 200 * Math.pow(2, attempts)));
      }
    }

    return this.fallback(input, new Error('Execution failed unexpectedly'));
  }

  protected async callLlmApi(prompt: string): Promise<string> {
    // In production, this connects to OpenAI / Anthropic SDK
    // Here we provide a mockable baseline implementation
    return JSON.stringify({ status: 'OK' });
  }

  private recordTokenMetrics(context: AgentContext, promptTokens: number, completionTokens: number) {
    const tokenEvent: TokenEvent = {
      agentName: this.name,
      model: this.modelName,
      promptTokens: Math.ceil(promptTokens),
      completionTokens: Math.ceil(completionTokens),
      costUSD: (promptTokens * 0.00000015) + (completionTokens * 0.0000006),
      correlationId: context.correlationId,
    };
    // Emit telemetry event
  }
}
