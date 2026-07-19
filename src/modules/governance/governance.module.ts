import { PlatformModule } from '@/platform/kernel/types';
import { Shield } from 'lucide-react';

export const governanceModule: PlatformModule = {
  id: 'governance', name: 'Governance', version: '1.0.0', domain: 'governance',
  routes: [ { path: '/governance', moduleId: 'governance', label: 'Governance' } ],
  navItems: [
    { id: 'nav-governance', label: 'Governance', href: '/governance', icon: Shield, group: 'Platform', order: 14 }
  ]
};
