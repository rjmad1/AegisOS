import { PlatformModule } from '@/platform/kernel/types';
import { Briefcase } from 'lucide-react';

export const projectsModule: PlatformModule = {
  id: 'projects', name: 'Projects', version: '1.0.0', domain: 'projects',
  routes: [ { path: '/projects', moduleId: 'projects', label: 'Projects' } ],
  navItems: [
    { id: 'nav-projects', label: 'Projects', href: '/projects', icon: Briefcase, group: 'Platform', order: 2 }
  ]
};
