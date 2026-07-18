import { PlatformModule } from '@/platform/kernel/types';
import { LayoutDashboard, HelpCircle } from 'lucide-react';

export const platformModule: PlatformModule = {
  id: 'platform',
  name: 'Platform Core',
  version: '1.0.0',
  domain: 'platform',
  description: 'Core dashboard, help, and system status widgets',
  
  routes: [
    { path: '/dashboard', moduleId: 'platform', label: 'Dashboard' },
    { path: '/help', moduleId: 'platform', label: 'Help & Documentation' },
    { path: '/mission-replay', moduleId: 'platform', label: 'Mission Replay' },
  ],
  
  navItems: [
    {
      id: 'nav-dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      group: 'Platform',
      order: 1,
    },
    {
      id: 'nav-help',
      label: 'Help',
      href: '/help',
      icon: HelpCircle,
      group: 'Platform',
      order: 2,
    },
  ],
  
  commands: [
    {
      id: 'cmd.dashboard.goto',
      title: 'Go to Dashboard',
      category: 'navigation',
      action: () => {
        window.location.href = '/dashboard';
      },
    },
    {
      id: 'cmd.help.goto',
      title: 'Go to Help & Docs',
      category: 'navigation',
      action: () => {
        window.location.href = '/help';
      },
    },
  ],
};
