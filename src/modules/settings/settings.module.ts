import { PlatformModule } from '@/platform/kernel/types';
import { Settings } from 'lucide-react';

export const settingsModule: PlatformModule = {
  id: 'settings',
  name: 'Settings Management',
  version: '1.0.0',
  domain: 'settings',
  description: 'Centralized console settings and preference panels',
  
  routes: [
    { path: '/settings', moduleId: 'settings', label: 'System Settings' },
  ],
  
  navItems: [
    {
      id: 'nav-settings',
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      group: 'Settings',
      order: 1,
    },
  ],
  
  commands: [
    {
      id: 'cmd.settings.goto',
      title: 'Go to Settings',
      category: 'navigation',
      action: () => {
        window.location.href = '/settings';
      },
    },
  ],
};
