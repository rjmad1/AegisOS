import { PlatformModule } from '@/platform/kernel/types';
import { Briefcase, Activity, Terminal, Server, MessageSquare, Play, GitBranch } from 'lucide-react';

export const operationsModule: PlatformModule = {
  id: 'operations',
  name: 'Operations',
  version: '1.0.0',
  domain: 'operations',
  description: 'Operations management, including runtime status, conversation logs, executions, and workflow metrics',
  
  routes: [
    { path: '/runtime', moduleId: 'operations', label: 'Runtime Status' },
    { path: '/conversations', moduleId: 'operations', label: 'Conversations' },
    { path: '/executions', moduleId: 'operations', label: 'Execution History' },
    { path: '/workflows', moduleId: 'operations', label: 'Workflow Registry' },
    { path: '/jobs', moduleId: 'operations', label: 'Background Jobs' },
    { path: '/activity', moduleId: 'operations', label: 'System Activity' },
    { path: '/logs', moduleId: 'operations', label: 'Runtime Logs' },
  ],
  
  navItems: [
    {
      id: 'nav-runtime',
      label: 'Runtime Status',
      href: '/runtime',
      icon: Server,
      group: 'Operations',
      order: 1,
    },
    {
      id: 'nav-conversations',
      label: 'Conversations',
      href: '/conversations',
      icon: MessageSquare,
      group: 'Operations',
      order: 2,
    },
    {
      id: 'nav-executions',
      label: 'Executions',
      href: '/executions',
      icon: Play,
      group: 'Operations',
      order: 3,
    },
    {
      id: 'nav-operations-workflows',
      label: 'Workflows',
      href: '/workflows',
      icon: GitBranch,
      group: 'Operations',
      order: 4,
    },
    {
      id: 'nav-jobs',
      label: 'Jobs',
      href: '/jobs',
      icon: Briefcase,
      group: 'Operations',
      order: 5,
    },
    {
      id: 'nav-activity',
      label: 'Activity',
      href: '/activity',
      icon: Activity,
      group: 'Operations',
      order: 6,
    },
    {
      id: 'nav-logs',
      label: 'Logs',
      href: '/logs',
      icon: Terminal,
      group: 'Operations',
      order: 7,
    },
  ],
  
  commands: [
    {
      id: 'cmd.runtime.goto',
      title: 'Show Runtime Health & Status',
      category: 'navigation',
      action: () => {
        window.location.href = '/runtime';
      },
    },
    {
      id: 'cmd.runtime.health',
      title: 'Show Runtime Health Dashboard',
      category: 'navigation',
      action: () => {
        window.location.href = '/runtime?tab=health';
      },
    },
    {
      id: 'cmd.runtime.config',
      title: 'Show Runtime Configuration Summary',
      category: 'navigation',
      action: () => {
        window.location.href = '/runtime?tab=config';
      },
    },
    {
      id: 'cmd.conversations.goto',
      title: 'Open Conversations Registry',
      category: 'navigation',
      action: () => {
        window.location.href = '/conversations';
      },
    },
    {
      id: 'cmd.conversations.open',
      title: 'Open Specific Conversation...',
      category: 'navigation',
      action: () => {
        const id = prompt("Enter Conversation ID (e.g. telegram-916029312):");
        if (id) window.location.href = `/conversations/${id}`;
      },
    },
    {
      id: 'cmd.executions.goto',
      title: 'Open Executions Registry',
      category: 'navigation',
      action: () => {
        window.location.href = '/executions';
      },
    },
    {
      id: 'cmd.executions.open',
      title: 'Open Specific Execution...',
      category: 'navigation',
      action: () => {
        const id = prompt("Enter Execution ID:");
        if (id) window.location.href = `/executions/${id}`;
      },
    },
    {
      id: 'cmd.workflows.goto',
      title: 'Open Workflows Registry',
      category: 'navigation',
      action: () => {
        window.location.href = '/workflows';
      },
    },
    {
      id: 'cmd.workflows.open',
      title: 'Open Specific Workflow...',
      category: 'navigation',
      action: () => {
        const id = prompt("Enter Workflow ID (e.g. audit-workflow):");
        if (id) window.location.href = `/workflows/${id}`;
      },
    },
    {
      id: 'cmd.agents.open',
      title: 'Open Specific Agent...',
      category: 'navigation',
      action: () => {
        const id = prompt("Enter Agent ID (main, developer, reviewer):");
        if (id) window.location.href = `/agents/${id}`;
      },
    },
    {
      id: 'cmd.tools.open',
      title: 'Open Specific Tool...',
      category: 'navigation',
      action: () => {
        const id = prompt("Enter Tool Name:");
        if (id) window.location.href = `/tools/${encodeURIComponent(id)}`;
      },
    },
    {
      id: 'cmd.jobs.goto',
      title: 'Go to Background Jobs',
      category: 'navigation',
      action: () => {
        window.location.href = '/jobs';
      },
    },
    {
      id: 'cmd.activity.goto',
      title: 'Go to System Activity',
      category: 'navigation',
      action: () => {
        window.location.href = '/activity';
      },
    },
    {
      id: 'cmd.logs.goto',
      title: 'Go to Runtime Logs',
      category: 'navigation',
      action: () => {
        window.location.href = '/logs';
      },
    },
  ],

  searchProviders: [
    {
      id: 'search-runtime-conversations',
      name: 'Conversations Search',
      category: 'conversations',
      search: async (query: string) => {
        try {
          const res = await fetch(`/api/v1/conversations?search=${encodeURIComponent(query)}`);
          if (!res.ok) return [];
          const data = await res.json();
          return data.conversations.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: `Started: ${new Date(c.startedAt).toLocaleDateString()} | ${c.summary}`,
            href: `/conversations/${c.id}`,
            category: 'conversations',
            score: 1.0
          }));
        } catch {
          return [];
        }
      }
    },
    {
      id: 'search-runtime-executions',
      name: 'Executions Search',
      category: 'jobs',
      search: async (query: string) => {
        try {
          const res = await fetch(`/api/v1/executions?search=${encodeURIComponent(query)}`);
          if (!res.ok) return [];
          const data = await res.json();
          return data.executions.map((e: any) => ({
            id: e.id,
            title: `Execution: ${e.id.slice(0, 8)} (${e.status})`,
            description: e.task,
            href: `/executions/${e.id}`,
            category: 'jobs',
            score: 0.9
          }));
        } catch {
          return [];
        }
      }
    },
    {
      id: 'search-runtime-workflows',
      name: 'Workflows Search',
      category: 'documentation',
      search: async (query: string) => {
        try {
          const res = await fetch(`/api/v1/workflows?search=${encodeURIComponent(query)}`);
          if (!res.ok) return [];
          const data = await res.json();
          return data.workflows.map((w: any) => ({
            id: w.id,
            title: w.name,
            description: w.description,
            href: `/workflows/${w.id}`,
            category: 'documentation',
            score: 0.8
          }));
        } catch {
          return [];
        }
      }
    },
    {
      id: 'search-runtime-agents',
      name: 'Agents Search',
      category: 'navigation',
      search: async (query: string) => {
        try {
          const res = await fetch('/api/v1/agents');
          if (!res.ok) return [];
          const data = await res.json();
          const q = query.toLowerCase();
          const matches = data.agents.filter((a: any) => 
            a.name.toLowerCase().includes(q) || 
            a.role.toLowerCase().includes(q)
          );
          return matches.map((a: any) => ({
            id: a.id,
            title: a.name,
            description: a.role,
            href: `/agents/${a.id}`,
            category: 'navigation',
            score: 0.7
          }));
        } catch {
          return [];
        }
      }
    },
    {
      id: 'search-runtime-tools',
      name: 'Tools Search',
      category: 'commands',
      search: async (query: string) => {
        try {
          const res = await fetch(`/api/v1/tools?search=${encodeURIComponent(query)}`);
          if (!res.ok) return [];
          const data = await res.json();
          return data.tools.map((t: any) => ({
            id: t.name,
            title: `Tool: ${t.name}`,
            description: t.description,
            href: `/tools/${encodeURIComponent(t.name)}`,
            category: 'commands',
            score: 0.6
          }));
        } catch {
          return [];
        }
      }
    }
  ]
};
