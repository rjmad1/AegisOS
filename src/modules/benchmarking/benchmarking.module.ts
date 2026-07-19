import { PlatformModule } from '@/platform/kernel/types';
import { Activity } from 'lucide-react';

export const benchmarkingModule: PlatformModule = {
  id: 'benchmarking', name: 'Benchmarking', version: '1.0.0', domain: 'benchmarking',
  routes: [ { path: '/benchmarking', moduleId: 'benchmarking', label: 'Benchmarking' } ],
  navItems: [
    { id: 'nav-benchmarking', label: 'Benchmarking', href: '/benchmarking', icon: Activity, group: 'Platform', order: 11 }
  ]
};
