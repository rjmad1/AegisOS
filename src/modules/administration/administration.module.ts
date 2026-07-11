import { PlatformModule } from '@/platform/kernel/types';
import { Users, Cpu, Server, Wrench } from 'lucide-react';

export const administrationModule: PlatformModule = {
  id: 'administration',
  name: 'Administration',
  version: '1.0.0',
  domain: 'administration',
  description: 'Platform infrastructure and resource administration, fleet management, hardware specs, and connected tools',
  
  routes: [
    { path: '/agents', moduleId: 'administration', label: 'Agent Fleet' },
    { path: '/tools', moduleId: 'administration', label: 'Connected Tools' },
    { path: '/models', moduleId: 'administration', label: 'Inference Models' },
    { path: '/hardware', moduleId: 'administration', label: 'Hardware Telemetry' },
  ],
  
  navItems: [
    {
      id: 'nav-agents',
      label: 'Agents',
      href: '/agents',
      icon: Users,
      group: 'Administration',
      order: 1,
    },
    {
      id: 'nav-tools',
      label: 'Tools',
      href: '/tools',
      icon: Wrench,
      group: 'Administration',
      order: 2,
    },
    {
      id: 'nav-models',
      label: 'Models',
      href: '/models',
      icon: Cpu,
      group: 'Administration',
      order: 3,
    },
    {
      id: 'nav-hardware',
      label: 'Hardware',
      href: '/hardware',
      icon: Server,
      group: 'Administration',
      order: 4,
    },
  ],
  
  commands: [
    {
      id: 'cmd.agents.goto',
      title: 'Go to Agent Fleet',
      category: 'navigation',
      action: () => {
        window.location.href = '/agents';
      },
    },
    {
      id: 'cmd.tools.goto',
      title: 'Go to Connected Tools Explorer',
      category: 'navigation',
      action: () => {
        window.location.href = '/tools';
      },
    },
    {
      id: 'cmd.models.goto',
      title: 'Go to Inference Models',
      category: 'navigation',
      action: () => {
        window.location.href = '/models';
      },
    },
    {
      id: 'cmd.hardware.goto',
      title: 'Go to Hardware Telemetry',
      category: 'navigation',
      action: () => {
        window.location.href = '/hardware';
      },
    },
  ],
};
