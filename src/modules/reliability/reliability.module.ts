import { PlatformModule } from '@/platform/kernel/types';
import { ShieldAlert, Activity, Heart, Flame } from 'lucide-react';

export const reliabilityModule: PlatformModule = {
  id: 'reliability',
  name: 'Reliability',
  version: '1.0.0',
  domain: 'operations',
  description: 'Autonomous Platform SRE, automated self-healing orchestration, chaos inject, and recovery dashboards',
  
  routes: [
    { path: '/reliability', moduleId: 'reliability', label: 'Reliability Control Center' },
  ],
  
  navItems: [
    {
      id: 'nav-reliability',
      label: 'Reliability',
      href: '/reliability',
      icon: ShieldAlert,
      group: 'Operations',
      order: 9,
    },
  ],
  
  commands: [
    {
      id: 'cmd.reliability.goto',
      title: 'Open Reliability Control Center',
      category: 'navigation',
      action: () => {
        window.location.href = '/reliability';
      },
    },
    {
      id: 'cmd.reliability.eoc',
      title: 'Show Enterprise Operations Center',
      category: 'navigation',
      action: () => {
        window.location.href = '/reliability?tab=eoc';
      },
    },
    {
      id: 'cmd.reliability.chaos',
      title: 'Trigger Chaos Engineering Panel',
      category: 'navigation',
      action: () => {
        window.location.href = '/reliability?tab=chaos';
      },
    }
  ],

  searchProviders: [
    {
      id: 'search-reliability-incidents',
      name: 'Incidents & Outages Search',
      category: 'commands',
      search: async (query: string) => {
        try {
          const res = await fetch('/api/v1/reliability');
          if (!res.ok) return [];
          const data = await res.json();
          const q = query.toLowerCase();
          const matches = (data.incidents?.list || []).filter((i: any) =>
            i.title.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q)
          );
          return matches.map((i: any) => ({
            id: i.id,
            title: `Incident: ${i.title}`,
            description: i.description,
            href: '/reliability?tab=eoc',
            category: 'commands',
            score: 0.9
          }));
        } catch {
          return [];
        }
      }
    }
  ]
};

export default reliabilityModule;
