import { PlatformModule } from '@/platform/kernel/types';
import { LayoutDashboard } from 'lucide-react';

export const platformModule: PlatformModule = {
  id: 'platform', name: 'Platform Core', version: '1.0.0', domain: 'platform',
  routes: [ { path: '/dashboard', moduleId: 'platform', label: 'Dashboard' } ],
  navItems: [
    { id: 'nav-dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Platform', order: 1 }
  ]
};
