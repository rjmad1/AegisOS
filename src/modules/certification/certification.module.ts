import { PlatformModule } from '@/platform/kernel/types';
import { Award } from 'lucide-react';

export const certificationModule: PlatformModule = {
  id: 'certification', name: 'Certification', version: '1.0.0', domain: 'certification',
  routes: [ { path: '/certification', moduleId: 'certification', label: 'Certification' } ],
  navItems: [
    { id: 'nav-certification', label: 'Certification', href: '/certification', icon: Award, group: 'Platform', order: 12 }
  ]
};
