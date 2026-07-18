import { PlatformModule } from '@/platform/kernel/types';
import { Briefcase } from 'lucide-react';

export const projectsModule: PlatformModule = {
  id: 'projects',
  name: 'Projects',
  version: '1.0.0',
  domain: 'operations',
  description: 'Scoped project workspaces with integrated agents, workflows, knowledge, and assets.',
  
  routes: [
    { path: '/projects', moduleId: 'projects', label: 'Projects Workspace' },
  ],
  
  navItems: [
    {
      id: 'nav-projects',
      label: 'Projects',
      href: '/projects',
      icon: Briefcase,
      group: 'Operations',
      order: 3, // Group after Agents/Workflows or in operational priority
    },
  ],
  
  commands: [
    {
      id: 'cmd.projects.goto',
      title: 'Open Projects Workspace',
      category: 'navigation',
      action: () => {
        window.location.href = '/projects';
      },
    },
  ]
};

export default projectsModule;
