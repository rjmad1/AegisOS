import { PlatformModule } from '@/platform/kernel/types';
import { Network } from 'lucide-react';

export const architectureExplorerModule: PlatformModule = {
  id: 'architecture-explorer', name: 'Architecture Explorer', version: '1.0.0', domain: 'architecture-explorer',
  routes: [ { path: '/architecture-explorer', moduleId: 'architecture-explorer', label: 'Architecture Explorer' } ],
  navItems: [
    { id: 'nav-architecture-explorer', label: 'Architecture Explorer', href: '/architecture-explorer', icon: Network, group: 'Platform', order: 18 }
  ]
};
