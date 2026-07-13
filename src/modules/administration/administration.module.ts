import { PlatformModule } from '@/platform/kernel/types';
import { Users, Cpu, Server, Wrench, Shield, Lock, Settings, Calendar, ShieldAlert } from 'lucide-react';

export const administrationModule: PlatformModule = {
  id: 'administration',
  name: 'Administration',
  version: '1.0.0',
  domain: 'administration',
  description: 'Platform infrastructure and resource administration, governance control plane, security, audit logs, and backups',
  
  routes: [
    { path: '/agents', moduleId: 'administration', label: 'Agent Fleet' },
    { path: '/tools', moduleId: 'administration', label: 'Connected Tools' },
    { path: '/models', moduleId: 'administration', label: 'Inference Models' },
    { path: '/hardware', moduleId: 'administration', label: 'Hardware Telemetry' },
    { path: '/admin', moduleId: 'administration', label: 'Platform Administration' },
    { path: '/admin/engineering-intelligence', moduleId: 'administration', label: 'Engineering Intelligence' },
    { path: '/security', moduleId: 'administration', label: 'Security Operations Center' },
  ],
  
  navItems: [
    {
      id: 'nav-admin',
      label: 'Administration Console',
      href: '/admin',
      icon: Shield,
      group: 'Administration',
      order: 0,
    },
    {
      id: 'nav-security',
      label: 'Security Operations',
      href: '/security',
      icon: Shield,
      group: 'Administration',
      order: 0.1,
    },
    {
      id: 'nav-eng-intelligence',
      label: 'Engineering Intel',
      href: '/admin/engineering-intelligence',
      icon: ShieldAlert,
      group: 'Administration',
      order: 0.5,
    },
    {
      id: 'nav-agents',
      label: 'Agents',
      href: '/agents',
      icon: Users,
      group: 'Administration',
      order: 1,
    },
    {
      id: 'nav-tools',
      label: 'Tools',
      href: '/tools',
      icon: Wrench,
      group: 'Administration',
      order: 2,
    },
    {
      id: 'nav-models',
      label: 'Models',
      href: '/models',
      icon: Cpu,
      group: 'Administration',
      order: 3,
    },
    {
      id: 'nav-hardware',
      label: 'Hardware',
      href: '/hardware',
      icon: Server,
      group: 'Administration',
      order: 4,
    },
  ],
  
  commands: [
    {
      id: 'cmd.admin.goto',
      title: 'Open Administration Console',
      category: 'navigation',
      action: () => {
        window.location.href = '/admin';
      },
    },
    {
      id: 'cmd.admin.users',
      title: 'Open Users Registry',
      category: 'navigation',
      action: () => {
        window.location.href = '/admin';
      },
    },
    {
      id: 'cmd.admin.roles',
      title: 'Open RBAC Matrix',
      category: 'navigation',
      action: () => {
        window.location.href = '/admin';
      },
    },
    {
      id: 'cmd.admin.audit',
      title: 'Open Audit Logs',
      category: 'navigation',
      action: () => {
        window.location.href = '/admin';
      },
    },
    {
      id: 'cmd.admin.config',
      title: 'Open Configuration Hub',
      category: 'navigation',
      action: () => {
        window.location.href = '/admin';
      },
    },
    {
      id: 'cmd.admin.backups',
      title: 'Open Backup Archive',
      category: 'navigation',
      action: () => {
        window.location.href = '/admin';
      },
    },
    {
      id: 'cmd.admin.diagnostics',
      title: 'Open Diagnostics Center',
      category: 'navigation',
      action: () => {
        window.location.href = '/admin';
      },
    },
    {
      id: 'cmd.agents.goto',
      title: 'Go to Agent Fleet',
      category: 'navigation',
      action: () => {
        window.location.href = '/agents';
      },
    },
    {
      id: 'cmd.tools.goto',
      title: 'Go to Connected Tools Explorer',
      category: 'navigation',
      action: () => {
        window.location.href = '/tools';
      },
    },
    {
      id: 'cmd.models.goto',
      title: 'Go to Inference Models',
      category: 'navigation',
      action: () => {
        window.location.href = '/models';
      },
    },
    {
      id: 'cmd.hardware.goto',
      title: 'Go to Hardware Telemetry',
      category: 'navigation',
      action: () => {
        window.location.href = '/hardware';
      },
    },
  ],

  searchProviders: [
    {
      id: 'admin.search.users',
      name: 'Users registry',
      category: 'administration',
      search: async (query: string) => {
        try {
          const res = await fetch('/api/v1/admin/users');
          if (!res.ok) return [];
          const users = await res.json();
          const q = query.toLowerCase();
          return users
            .filter((u: any) => u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q))
            .map((u: any) => ({
              id: u.id,
              title: u.displayName,
              description: `User registry entry: ${u.email} (Role: ${u.role})`,
              href: '/admin',
              category: 'administration',
              score: 0.8
            }));
        } catch {
          return [];
        }
      }
    },
    {
      id: 'admin.search.backups',
      name: 'Backup snapshots',
      category: 'administration',
      search: async (query: string) => {
        try {
          const res = await fetch('/api/v1/admin/backups');
          if (!res.ok) return [];
          const backups = await res.json();
          const q = query.toLowerCase();
          return backups
            .filter((b: any) => b.filename.toLowerCase().includes(q) || b.notes.toLowerCase().includes(q))
            .map((b: any) => ({
              id: b.id,
              title: b.filename,
              description: `Backup archive: ${b.notes} (${(b.sizeBytes / 1024 / 1024).toFixed(2)} MB)`,
              href: '/admin',
              category: 'administration',
              score: 0.7
            }));
        } catch {
          return [];
        }
      }
    },
    {
      id: 'admin.search.audit',
      name: 'Audit logs',
      category: 'administration',
      search: async (query: string) => {
        try {
          const res = await fetch(`/api/v1/admin/audit?query=${encodeURIComponent(query)}`);
          if (!res.ok) return [];
          const logs = await res.json();
          return logs.slice(0, 10).map((l: any) => ({
            id: l.id,
            title: l.action,
            description: `Audit log: [${l.category}] ${l.details} by ${l.userId}`,
            href: '/admin',
            category: 'administration',
            score: 0.6
          }));
        } catch {
          return [];
        }
      }
    }
  ]
};
