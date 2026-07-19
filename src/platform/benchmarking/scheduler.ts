import { IBenchmarkScheduler, IBenchmarkOrchestrator, BenchmarkOutputArtifacts } from './interfaces';
import { BenchmarkSuiteDescriptor } from './descriptor';
import { SubsystemBenchmarkPack } from './packs';

/**
 * Benchmark Scheduler
 * 
 * Responsible for scheduling suites, respecting priorities, dependencies,
 * and hardware affinities.
 */
export class BenchmarkScheduler implements IBenchmarkScheduler {
  constructor(private orchestrator: IBenchmarkOrchestrator) {}

  public async schedule(descriptors: BenchmarkSuiteDescriptor[]): Promise<BenchmarkOutputArtifacts[]> {
    // Basic sorting by priority. In a real system, 'high'/'normal'/'low' 
    // would be mapped to numeric weights, and dependencies would be resolved.
    const sorted = [...descriptors].sort((a, b) => {
      const weightA = this.getPriorityWeight(a.suite.priority);
      const weightB = this.getPriorityWeight(b.suite.priority);
      return weightB - weightA; // Higher weight first
    });

    const results: BenchmarkOutputArtifacts[] = [];

    // For now, execute sequentially. 
    // Future expansion: parallel execution via worker pools.
    for (const descriptor of sorted) {
      try {
        const artifacts = await this.orchestrator.executeDescriptor(descriptor);
        results.push(artifacts);
      } catch (error) {
        console.error(`Benchmark Suite ${descriptor.suite.id} failed:`, error);
        // Continue with the next suite or halt depending on policy
      }
    }

    return results;
  }

  public async schedulePacks(packs: SubsystemBenchmarkPack[]): Promise<BenchmarkOutputArtifacts[][]> {
    const results: BenchmarkOutputArtifacts[][] = [];
    
    for (const pack of packs) {
      try {
        const artifacts = await this.orchestrator.executePack(pack);
        results.push(artifacts);
      } catch (error) {
        console.error(`Benchmark Pack ${pack.pack.id} failed:`, error);
      }
    }
    
    return results;
  }

  private getPriorityWeight(priority: string): number {
    switch (priority.toLowerCase()) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }
}
