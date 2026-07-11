import { CommandRegistry } from '@/platform/commands/CommandRegistry';

export function useCommands() {
  return {
    register: CommandRegistry.register.bind(CommandRegistry),
    unregister: CommandRegistry.unregister.bind(CommandRegistry),
    execute: CommandRegistry.execute.bind(CommandRegistry),
    getAll: CommandRegistry.getAllCommands.bind(CommandRegistry),
    search: CommandRegistry.search.bind(CommandRegistry),
    getPinned: CommandRegistry.getPinnedCommands.bind(CommandRegistry),
    getRecent: CommandRegistry.getRecentCommands.bind(CommandRegistry),
  };
}
