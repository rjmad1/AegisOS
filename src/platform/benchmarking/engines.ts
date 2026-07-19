import { IBenchmarkExecutionEngine, IBenchmark } from './interfaces';
import { BenchmarkExecutionContext } from './context';

/**
 * Base Execution Engine implementation that can be extended for specific environments.
 */
export abstract class BaseExecutionEngine implements IBenchmarkExecutionEngine {
  public abstract readonly engineType: string;

  public async execute(benchmark: IBenchmark, context: BenchmarkExecutionContext): Promise<void> {
    // Shared setup logic for environments can go here if needed
    await this.runBenchmark(benchmark, context);
  }

  protected abstract runBenchmark(benchmark: IBenchmark, context: BenchmarkExecutionContext): Promise<void>;
}

export class MicroBenchmarkEngine extends BaseExecutionEngine {
  public readonly engineType = 'micro';

  protected async runBenchmark(benchmark: IBenchmark, context: BenchmarkExecutionContext): Promise<void> {
    // In a real implementation, this would execute scenarios in-process or via lightweight workers
    for (const scenario of benchmark.scenarios) {
      await scenario.prepare(context);
      await scenario.execute(context);
      await scenario.cleanup(context);
    }
  }
}

export class SubsystemBenchmarkEngine extends BaseExecutionEngine {
  public readonly engineType = 'subsystem';

  protected async runBenchmark(benchmark: IBenchmark, context: BenchmarkExecutionContext): Promise<void> {
    // In a real implementation, this might spin up specific sub-components and mock the rest
    for (const scenario of benchmark.scenarios) {
      await scenario.prepare(context);
      await scenario.execute(context);
      await scenario.cleanup(context);
    }
  }
}

export class ScenarioBenchmarkEngine extends BaseExecutionEngine {
  public readonly engineType = 'scenario';

  protected async runBenchmark(benchmark: IBenchmark, context: BenchmarkExecutionContext): Promise<void> {
    // End-to-end execution involving multiple systems
    for (const scenario of benchmark.scenarios) {
      await scenario.prepare(context);
      await scenario.execute(context);
      await scenario.cleanup(context);
    }
  }
}
