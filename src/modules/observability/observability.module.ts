import { PlatformModule } from '@/platform/kernel/types';
import { Eye } from 'lucide-react';

export const observabilityModule: PlatformModule = {
  id: 'observability', name: 'Observability', version: '1.0.0', domain: 'observability',
  routes: [ { path: '/observability', moduleId: 'observability', label: 'Observability' } ],
  navItems: [
    { id: 'nav-observability', label: 'Observability', href: '/observability', icon: Eye, group: 'Platform', order: 10 }
  ]
};
