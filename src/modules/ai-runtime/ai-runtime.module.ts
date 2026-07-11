import { PlatformModule } from '@/platform/kernel/types';
import { Server, Cpu, GitBranch, Shield, Link2, Tag, HelpCircle, Activity } from 'lucide-react';

export const aiRuntimeModule: PlatformModule = {
  id: 'ai-runtime',
  name: 'AI Gateway',
  version: '1.0.0',
  domain: 'operations',
  description: 'AI Runtime Gateway Control Plane (LiteLLM + Ollama integration)',

  routes: [
    { path: '/ai-runtime', moduleId: 'ai-runtime', label: 'AI Gateway Status' },
    { path: '/ai-runtime/providers', moduleId: 'ai-runtime', label: 'AI Providers' },
    { path: '/ai-runtime/graph', moduleId: 'ai-runtime', label: 'Relationship Graph' },
    { path: '/ai-runtime/health', moduleId: 'ai-runtime', label: 'Health Dashboard' },
    { path: '/ai-runtime/routes', moduleId: 'ai-runtime', label: 'Gateway Routes' },
    { path: '/ai-runtime/aliases', moduleId: 'ai-runtime', label: 'Model Aliases' },
    { path: '/ai-runtime/endpoints', moduleId: 'ai-runtime', label: 'Connection Endpoints' },
    { path: '/models', moduleId: 'ai-runtime', label: 'Model Explorer' }
  ],

  navItems: [
    {
      id: 'nav-ai-runtime',
      label: 'AI Gateway Status',
      href: '/ai-runtime',
      icon: Server,
      group: 'AI Control Plane',
      order: 1
    },
    {
      id: 'nav-ai-providers',
      label: 'AI Providers',
      href: '/ai-runtime/providers',
      icon: Shield,
      group: 'AI Control Plane',
      order: 2
    },
    {
      id: 'nav-ai-models',
      label: 'Model Explorer',
      href: '/models',
      icon: Cpu,
      group: 'AI Control Plane',
      order: 3
    },
    {
      id: 'nav-ai-graph',
      label: 'Routing Graph',
      href: '/ai-runtime/graph',
      icon: GitBranch,
      group: 'AI Control Plane',
      order: 4
    },
    {
      id: 'nav-ai-health',
      label: 'Health & Status',
      href: '/ai-runtime/health',
      icon: Activity,
      group: 'AI Control Plane',
      order: 5
    },
    {
      id: 'nav-ai-routes',
      label: 'Gateway Routes',
      href: '/ai-runtime/routes',
      icon: GitBranch,
      group: 'AI Control Plane',
      order: 6
    },
    {
      id: 'nav-ai-aliases',
      label: 'Model Aliases',
      href: '/ai-runtime/aliases',
      icon: Tag,
      group: 'AI Control Plane',
      order: 7
    },
    {
      id: 'nav-ai-endpoints',
      label: 'Endpoints',
      href: '/ai-runtime/endpoints',
      icon: Link2,
      group: 'AI Control Plane',
      order: 8
    }
  ],

  commands: [
    {
      id: 'cmd.ai-provider.open',
      title: 'Open Provider Detail...',
      category: 'navigation',
      action: () => {
        const id = prompt("Enter Provider ID (e.g. ollama-ai-runtime, litellm-ai-runtime):");
        if (id) window.location.href = `/ai-runtime/providers/${id}`;
      }
    },
    {
      id: 'cmd.ai-model.open',
      title: 'Open Model Detail...',
      category: 'navigation',
      action: () => {
        const id = prompt("Enter Model ID (e.g. ollama:gemma4:latest):");
        if (id) window.location.href = `/models/${encodeURIComponent(id)}`;
      }
    },
    {
      id: 'cmd.ai-runtime.open',
      title: 'Open Runtime Gateway Overview',
      category: 'navigation',
      action: () => {
        window.location.href = '/ai-runtime';
      }
    },
    {
      id: 'cmd.ai-capability.open',
      title: 'Open Capability Matrix',
      category: 'navigation',
      action: () => {
        window.location.href = '/models?tab=matrix';
      }
    },
    {
      id: 'cmd.ai-alias.open',
      title: 'Open Alias Explorer',
      category: 'navigation',
      action: () => {
        window.location.href = '/ai-runtime/aliases';
      }
    },
    {
      id: 'cmd.ai-endpoint.open',
      title: 'Open Endpoint Explorer',
      category: 'navigation',
      action: () => {
        window.location.href = '/ai-runtime/endpoints';
      }
    },
    {
      id: 'cmd.ai-provider-health.show',
      title: 'Show Provider Health Dashboard',
      category: 'quick-actions',
      action: () => {
        window.location.href = '/ai-runtime/health';
      }
    },
    {
      id: 'cmd.ai-runtime-status.show',
      title: 'Show Runtime Gateway Status',
      category: 'quick-actions',
      action: () => {
        window.location.href = '/ai-runtime';
      }
    }
  ],

  searchProviders: [
    {
      id: 'search-ai-providers',
      name: 'AI Providers Search',
      category: 'navigation',
      search: async (query: string) => {
        try {
          const res = await fetch('/api/v1/ai/providers');
          if (!res.ok) return [];
          const data = await res.json();
          const q = query.toLowerCase();
          const matches = data.providers.filter((p: any) =>
            p.name.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q)
          );
          return matches.map((p: any) => ({
            id: p.id,
            title: `AI Provider: ${p.name}`,
            description: `Type: ${p.type} | Version: ${p.version} | Health: ${p.health}`,
            href: `/ai-runtime/providers/${p.id}`,
            category: 'navigation',
            score: 0.95
          }));
        } catch {
          return [];
        }
      }
    },
    {
      id: 'search-ai-models',
      name: 'AI Models Search',
      category: 'documentation',
      search: async (query: string) => {
        try {
          const res = await fetch(`/api/v1/ai/models?q=${encodeURIComponent(query)}&pageSize=50`);
          if (!res.ok) return [];
          const data = await res.json();
          return data.data.map((m: any) => ({
            id: m.id,
            title: `AI Model: ${m.name}`,
            description: `Family: ${m.family} | Size: ${m.sizeDisplay} | Provider: ${m.providerName}`,
            href: `/models/${encodeURIComponent(m.id)}`,
            category: 'documentation',
            score: 0.9
          }));
        } catch {
          return [];
        }
      }
    },
    {
      id: 'search-ai-aliases',
      name: 'AI Model Aliases Search',
      category: 'settings',
      search: async (query: string) => {
        try {
          const res = await fetch('/api/v1/ai/aliases');
          if (!res.ok) return [];
          const data = await res.json();
          const q = query.toLowerCase();
          const matches = data.aliases.filter((a: any) =>
            a.alias.toLowerCase().includes(q) ||
            a.modelName.toLowerCase().includes(q)
          );
          return matches.map((a: any) => ({
            id: `alias:${a.alias}`,
            title: `Model Alias: ${a.alias}`,
            description: `Routes to underlying model: ${a.modelName} on ${a.providerName}`,
            href: `/ai-runtime/aliases`,
            category: 'settings',
            score: 0.85
          }));
        } catch {
          return [];
        }
      }
    },
    {
      id: 'search-ai-endpoints',
      name: 'AI Endpoints Search',
      category: 'settings',
      search: async (query: string) => {
        try {
          const res = await fetch('/api/v1/ai/endpoints');
          if (!res.ok) return [];
          const data = await res.json();
          const q = query.toLowerCase();
          const matches = data.endpoints.filter((ep: any) =>
            ep.url.toLowerCase().includes(q) ||
            ep.providerName.toLowerCase().includes(q)
          );
          return matches.map((ep: any) => ({
            id: ep.id,
            title: `AI Endpoint: ${ep.providerName}`,
            description: `Socket: ${ep.url} [${ep.protocol}]`,
            href: `/ai-runtime/endpoints`,
            category: 'settings',
            score: 0.8
          }));
        } catch {
          return [];
        }
      }
    }
  ]
};
