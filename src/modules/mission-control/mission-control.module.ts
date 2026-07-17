import { PlatformModule } from '@/platform/kernel/types';
import { Radio } from 'lucide-react';

export const missionControlModule: PlatformModule = {
  id: 'mission-control',
  name: 'Mission Control',
  version: '1.0.0',
  domain: 'operations',
  description: 'Integrated platform control tower monitoring health, executing policy rules, and providing decision-intelligence recommendations.',
  
  routes: [
    { path: '/mission-control', moduleId: 'mission-control', label: 'Mission Control' },
  ],
  
  navItems: [
    {
      id: 'nav-mission-control',
      label: 'Mission Control',
      href: '/mission-control',
      icon: Radio,
      group: 'Operations',
      order: 1, // Set at order 1 to prioritize visibility in the Operations sidebar
    },
  ],
  
  commands: [
    {
      id: 'cmd.mission-control.goto',
      title: 'Open Mission Control',
      category: 'navigation',
      action: () => {
        window.location.href = '/mission-control';
      },
    },
  ]
};

export default missionControlModule;
