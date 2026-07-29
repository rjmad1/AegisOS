import { PlatformModule } from '@/platform/kernel/types';
import { Brain } from 'lucide-react';

export const conversaModule: PlatformModule = {
  id: 'conversa',
  name: 'Conversa Workspace',
  version: '1.0.0',
  domain: 'conversa',
  routes: [{ path: '/conversa', moduleId: 'conversa', label: 'Conversa Workspace' }],
  navItems: [
    {
      id: 'nav-conversa',
      label: 'Conversa Workspace',
      href: '/conversa',
      icon: Brain,
      group: 'Platform',
      order: 4,
    },
  ],
};
