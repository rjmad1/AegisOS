import { PlatformModule } from '@/platform/kernel/types';
import { Code } from 'lucide-react';

export const developerModule: PlatformModule = {
  id: 'developer', name: 'Developer Tools', version: '1.0.0', domain: 'developer',
  routes: [ { path: '/developer-portal', moduleId: 'developer', label: 'Developer Tools' } ],
  navItems: [
    { id: 'nav-developer-portal', label: 'Developer Tools', href: '/developer-portal', icon: Code, group: 'Platform', order: 17 }
  ]
};
