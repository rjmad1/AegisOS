import { PlatformModule } from '@/platform/kernel/types';
import { Cpu } from 'lucide-react';

export const capabilitiesModule: PlatformModule = {
  id: 'capabilities', name: 'Capabilities', version: '1.0.0', domain: 'capabilities',
  routes: [ { path: '/capabilities', moduleId: 'capabilities', label: 'Capabilities' } ],
  navItems: [
    { id: 'nav-capabilities', label: 'Capabilities', href: '/capabilities', icon: Cpu, group: 'Platform', order: 6 }
  ]
};
