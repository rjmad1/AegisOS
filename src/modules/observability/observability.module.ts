import { PlatformModule } from '@/platform/kernel/types';
import { Eye, ShieldAlert, BarChart3, Settings } from 'lucide-react';

export const observabilityModule: PlatformModule = {
  id: 'observability',
  name: 'Observability',
  version: '1.0.0',
  domain: 'operations',
  description: 'Enterprise Observability Platform, distributed tracing, metrics console, and gap reports',
  
  routes: [
    { path: '/observability', moduleId: 'observability', label: 'Observability Console' },
  ],
  
  navItems: [
    {
      id: 'nav-observability',
      label: 'Observability',
      href: '/observability',
      icon: Eye,
      group: 'Operations',
      order: 8,
    },
  ],
  
  commands: [
    {
      id: 'cmd.observability.goto',
      title: 'Open Observability Console',
      category: 'navigation',
      action: () => {
        window.location.href = '/observability';
      },
    },
    {
      id: 'cmd.observability.readiness',
      title: 'Show Observability Readiness Report',
      category: 'navigation',
      action: () => {
        window.location.href = '/observability?tab=readiness';
      },
    },
  ],

  searchProviders: [
    {
      id: 'search-observability-alerts',
      name: 'Active Alerts Search',
      category: 'commands',
      search: async (query: string) => {
        try {
          const res = await fetch('/api/v1/observability');
          if (!res.ok) return [];
          const data = await res.json();
          const q = query.toLowerCase();
          const matches = (data.alerts?.active || []).filter((a: any) =>
            a.name.toLowerCase().includes(q) ||
            a.message.toLowerCase().includes(q)
          );
          return matches.map((a: any) => ({
            id: a.id,
            title: `Alert: ${a.name}`,
            description: a.message,
            href: '/observability?tab=diagnostics',
            category: 'commands',
            score: 0.95
          }));
        } catch {
          return [];
        }
      }
    }
  ]
};

export default observabilityModule;
