import { PlatformModule } from '@/platform/kernel/types';
import { Users, Server } from 'lucide-react';

export const operationsModule: PlatformModule = {
  id: 'operations', name: 'Operations', version: '1.0.0', domain: 'operations',
  routes: [ 
    { path: '/operations', moduleId: 'operations', label: 'Operations' },
    { path: '/participants', moduleId: 'operations', label: 'Participants' }
  ],
  navItems: [
    { id: 'nav-participants', label: 'Participants', href: '/participants', icon: Users, group: 'Platform', order: 3 },
    { id: 'nav-operations', label: 'Operations', href: '/operations', icon: Server, group: 'Platform', order: 15 }
  ]
};
