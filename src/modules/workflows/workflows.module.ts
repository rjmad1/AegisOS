import { PlatformModule } from '@/platform/kernel/types';
import { GitBranch } from 'lucide-react';

export const workflowsModule: PlatformModule = {
  id: 'workflows', name: 'Workflows', version: '1.0.0', domain: 'workflows',
  routes: [ { path: '/workflows', moduleId: 'workflows', label: 'Workflows' } ],
  navItems: [
    { id: 'nav-workflows', label: 'Workflows', href: '/workflows', icon: GitBranch, group: 'Platform', order: 4 }
  ]
};
