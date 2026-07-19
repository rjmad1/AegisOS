import { PlatformModule } from '@/platform/kernel/types';
import { Brain, Cpu } from 'lucide-react';

export const platformIntelligenceModule: PlatformModule = {
  id: 'platform-intelligence', name: 'Platform Intelligence', version: '1.0.0', domain: 'platform-intelligence',
  routes: [ 
    { path: '/models', moduleId: 'platform-intelligence', label: 'Models & Providers' },
    { path: '/platform-intelligence', moduleId: 'platform-intelligence', label: 'Platform Intelligence' }
  ],
  navItems: [
    { id: 'nav-models', label: 'Models & Providers', href: '/models', icon: Cpu, group: 'Platform', order: 7 },
    { id: 'nav-platform-intelligence', label: 'Platform Intelligence', href: '/platform-intelligence', icon: Brain, group: 'Platform', order: 9 }
  ]
};
