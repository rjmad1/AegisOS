import { PlatformModule } from '@/platform/kernel/types';
import { BookOpen } from 'lucide-react';

export const knowledgeModule: PlatformModule = {
  id: 'knowledge', name: 'Knowledge', version: '1.0.0', domain: 'knowledge',
  routes: [ { path: '/knowledge', moduleId: 'knowledge', label: 'Knowledge' } ],
  navItems: [
    { id: 'nav-knowledge', label: 'Knowledge', href: '/knowledge', icon: BookOpen, group: 'Platform', order: 5 }
  ]
};
