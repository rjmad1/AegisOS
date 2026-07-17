import { PlatformModule } from '@/platform/kernel/types';
import { Brain } from 'lucide-react';

export const engineeringIntelligenceModule: PlatformModule = {
  id: 'engineering-intelligence',
  name: 'Engineering Intelligence',
  version: '1.0.0',
  domain: 'operations',
  description: 'Engineering Brain of AegisOS, executing structural analysis, predictions, and human-in-the-loop recommendation approvals.',
  
  routes: [
    { path: '/engineering-intelligence', moduleId: 'engineering-intelligence', label: 'Engineering Brain' },
  ],
  
  navItems: [
    {
      id: 'nav-engineering-intelligence',
      label: 'Engineering Brain',
      href: '/engineering-intelligence',
      icon: Brain,
      group: 'Operations',
      order: 7,
    },
  ],
  
  commands: [
    {
      id: 'cmd.engineering-intelligence.goto',
      title: 'Open Engineering Brain Console',
      category: 'navigation',
      action: () => {
        window.location.href = '/engineering-intelligence';
      },
    },
  ]
};

export default engineeringIntelligenceModule;
