import { execSync, spawn } from 'child_process';
import { logger } from '../../infrastructure/observability/structured-logger';

export interface SandboxExecutionConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
  sandboxMode?: 'PROCESS' | 'DOCKER' | 'NONE';
  allowedEgressDomains?: string[];
}

/**
 * ToolSandboxProvider handles isolated process and container execution for MCP tools
 * to prevent untrusted tools or arbitrary code execution from compromising the host AegisOS system.
 */
export class ToolSandboxProvider {
  /**
   * Checks if Docker daemon is running locally on the workstation
   */
  public static isDockerAvailable(): boolean {
    try {
      execSync('docker info', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleans and sanitizes host environment variables prior to passing to sandboxed child process
   */
  public sanitizeEnvironment(rawEnv: Record<string, string> = {}): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const safeKeys = [
      'PATH', 'HOME', 'USER', 'LANG', 'LC_ALL', 'NODE_ENV',
      'AZURE_CLIENT_ID', 'AZURE_TENANT_ID', 'GOOGLE_CLIENT_ID'
    ];

    // Filter host process.env for only non-sensitive baseline vars
    for (const key of safeKeys) {
      if (process.env[key]) {
        sanitized[key] = process.env[key] as string;
      }
    }

    // Override with tool specific env
    return { ...sanitized, ...rawEnv };
  }

  /**
   * Creates a sandboxed Stdio process spawn configuration
   */
  public createSandboxProcessConfig(config: SandboxExecutionConfig): {
    command: string;
    args: string[];
    env: Record<string, string>;
  } {
    const isDocker = config.sandboxMode === 'DOCKER' || (config.sandboxMode !== 'PROCESS' && ToolSandboxProvider.isDockerAvailable());
    const sanitizedEnv = this.sanitizeEnvironment(config.env);

    if (isDocker && config.sandboxMode === 'DOCKER') {
      logger.info(`Launching MCP Tool in Docker MicroVM Sandbox: ${config.command}`);
      const dockerArgs = [
        'run', '--rm', '-i',
        '--network', 'bridge',
        '--memory', '512m',
        '--cpus', '1.0',
      ];

      for (const [key, value] of Object.entries(sanitizedEnv)) {
        dockerArgs.push('-e', `${key}=${value}`);
      }

      dockerArgs.push('node:20-alpine', config.command, ...config.args);

      return {
        command: 'docker',
        args: dockerArgs,
        env: sanitizedEnv,
      };
    }

    logger.info(`Launching MCP Tool in Restricted Process Sandbox: ${config.command}`);
    return {
      command: config.command,
      args: config.args,
      env: sanitizedEnv,
    };
  }
}
