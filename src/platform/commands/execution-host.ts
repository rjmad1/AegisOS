/**
 * Execution Host Abstraction
 * 
 * Extracts environment-specific metadata (environment variables, CI/CD run IDs,
 * Git SHAs, hardware specifications) to attach to qualification provenance.
 */

export interface ExecutionHostMetadata {
  hostType: 'github_actions' | 'local_cli' | 'unknown';
  buildId: string;
  runNumber: string;
  gitSha: string;
  hardwareCpuCount: number;
  hardwareMemoryMB: number;
  osPlatform: string;
}

export class ExecutionHost {
  public static getMetadata(): ExecutionHostMetadata {
    const isGitHub = !!process.env.GITHUB_ACTIONS;
    
    // Simple mock detection of hardware parameters
    const os = require('os');
    const cpuCount = os.cpus().length;
    const totalMemoryMB = Math.round(os.totalmem() / (1024 * 1024));

    return {
      hostType: isGitHub ? 'github_actions' : 'local_cli',
      buildId: process.env.GITHUB_RUN_ID ?? `local-build-${Date.now()}`,
      runNumber: process.env.GITHUB_RUN_NUMBER ?? '1',
      gitSha: process.env.GITHUB_SHA ?? process.env.GIT_SHA ?? 'dev-local',
      hardwareCpuCount: cpuCount,
      hardwareMemoryMB: totalMemoryMB,
      osPlatform: os.platform()
    };
  }
}
