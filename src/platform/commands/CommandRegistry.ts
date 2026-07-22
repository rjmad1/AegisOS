// ============================================================================
// Command Registry — Registration, execution, history
// ============================================================================

import type { PlatformCommand, CommandContext, ExecutionResult } from './types';
import { EventBus } from '../event-bus/EventBus';

const RECENT_COMMANDS_KEY = 'platform:recent-commands';
const MAX_RECENT = 30;

class CommandRegistryImpl {
  private commands: Map<string, PlatformCommand> = new Map();

  // ---- Registration ----

  register(command: PlatformCommand): void {
    this.commands.set(command.id, command);
  }

  registerMany(commands: PlatformCommand[]): void {
    for (const cmd of commands) this.register(cmd);
  }

  unregister(id: string): void {
    this.commands.delete(id);
  }

  // ---- Query ----

  getCommand(id: string): PlatformCommand | undefined {
    return this.commands.get(id);
  }

  getAllCommands(): PlatformCommand[] {
    return Array.from(this.commands.values()).filter((cmd) => !cmd.when || cmd.when());
  }

  getByCategory(category: string): PlatformCommand[] {
    return this.getAllCommands().filter((cmd) => cmd.category === category);
  }

  getPinnedCommands(): PlatformCommand[] {
    return this.getAllCommands().filter((cmd) => cmd.isPinned);
  }

  search(query: string): PlatformCommand[] {
    const q = query.toLowerCase();
    return this.getAllCommands()
      .filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(q) ||
          cmd.description?.toLowerCase().includes(q) ||
          cmd.category.toLowerCase().includes(q),
      )
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  // ---- Execution ----

  async execute(id: string): Promise<void> {
    const command = this.commands.get(id);
    if (!command) {
      console.warn(`[CommandRegistry] Command "${id}" not found`);
      return;
    }
    if (command.when && !command.when()) {
      console.warn(`[CommandRegistry] Command "${id}" condition not met`);
      return;
    }

    try {
      if (command.action) await command.action();
      this.addRecentCommand(id);
      EventBus.publish('command:executed', { commandId: id, timestamp: Date.now() });
    } catch (err) {
      console.error(`[CommandRegistry] Command "${id}" failed:`, err);
    }
  }

  // ---- Governed Execution ----
  
  async executeCommand(id: string, payload: any, context: CommandContext): Promise<ExecutionResult> {
    const start = performance.now();
    const correlationId = `cmd_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const command = this.getCommand(id);
    if (!command) {
      return {
        outcome: 'FAILURE',
        error: `Command '${id}' not found in registry.`,
        correlationId,
        executionDurationMs: performance.now() - start
      };
    }

    if (command.when && !command.when()) {
      return {
        outcome: 'FAILURE',
        error: `Command '${id}' condition not met.`,
        correlationId,
        executionDurationMs: performance.now() - start
      };
    }

    try {
      if (command.validate) {
        const validationResult = await command.validate(payload, context);
        if (validationResult !== true) {
          return {
            outcome: 'FAILURE',
            error: typeof validationResult === 'string' ? validationResult : 'Validation failed.',
            correlationId,
            executionDurationMs: performance.now() - start
          };
        }
      }

      let result: ExecutionResult;
      if (command.execute) {
        result = await command.execute(payload, context);
      } else if (command.action) {
        await command.action();
        result = {
          outcome: 'SUCCESS',
          correlationId,
          executionDurationMs: performance.now() - start
        };
      } else {
        throw new Error(`Command '${id}' has no execution logic.`);
      }
      
      console.log(`[Audit] Executed ${command.id} [${command.auditClassification || 'ROUTINE'}] - Outcome: ${result.outcome} - CorrelationId: ${correlationId}`);
      
      this.addRecentCommand(id);
      EventBus.publish('command:executed', { commandId: id, timestamp: Date.now() });

      return {
        ...result,
        correlationId,
        executionDurationMs: performance.now() - start
      };
    } catch (err: any) {
      return {
        outcome: 'FAILURE',
        error: err.message || 'Unknown execution error',
        correlationId,
        executionDurationMs: performance.now() - start
      };
    }
  }

  // ---- Recent Commands ----

  getRecentCommands(): string[] {
    try {
      const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private addRecentCommand(id: string): void {
    try {
      const recent = this.getRecentCommands().filter((c) => c !== id);
      recent.unshift(id);
      localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
    } catch {
      // noop
    }
  }
}

export const CommandRegistry = new CommandRegistryImpl();
