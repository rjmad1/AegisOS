import { PlatformModule } from '@/platform/kernel/types';
import { ShieldCheck } from 'lucide-react';

export const qualificationModule: PlatformModule = {
  id: 'qualification', name: 'Qualification', version: '1.0.0', domain: 'qualification',
  routes: [ { path: '/qualification', moduleId: 'qualification', label: 'Qualification' } ],
  navItems: [
    { id: 'nav-qualification', label: 'Qualification', href: '/qualification', icon: ShieldCheck, group: 'Platform', order: 13 }
  ]
};
