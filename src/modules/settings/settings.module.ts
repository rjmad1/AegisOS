import { PlatformModule } from '@/platform/kernel/types';
import { Settings } from 'lucide-react';

export const settingsModule: PlatformModule = {
  id: 'settings', name: 'Settings', version: '1.0.0', domain: 'settings',
  routes: [ { path: '/settings', moduleId: 'settings', label: 'Settings' } ],
  navItems: [
    { id: 'nav-settings', label: 'Settings', href: '/settings', icon: Settings, group: 'Platform', order: 16 }
  ]
};
