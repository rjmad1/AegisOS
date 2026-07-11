// ============================================================================
// Infrastructure Module — Frontend Subsystem Definition
// ============================================================================

import { PlatformModule } from '@/platform/kernel/types';
import { Server, Cpu, HardDrive, Network, Database, Layers, Activity } from 'lucide-react';

export const infrastructureModule: PlatformModule = {
  id: 'infrastructure',
  name: 'Infrastructure',
  version: '1.0.0',
  domain: 'infrastructure',
  description: 'Infrastructure observability, including host metrics, processes, containers, services, and relationship graphs',

  routes: [
    { path: '/infrastructure', moduleId: 'infrastructure', label: 'Infrastructure Dashboard' },
  ],

  navItems: [
    {
      id: 'nav-infrastructure',
      label: 'Infrastructure',
      href: '/infrastructure',
      icon: Server,
      group: 'Operations',
      order: 8,
    },
  ],

  commands: [
    {
      id: 'cmd.infrastructure.goto',
      title: 'Open Infrastructure Overview',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=overview';
      },
    },
    {
      id: 'cmd.infrastructure.host',
      title: 'Open Host Information',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=host';
      },
    },
    {
      id: 'cmd.infrastructure.cpu',
      title: 'Open CPU Telemetry',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=cpu';
      },
    },
    {
      id: 'cmd.infrastructure.memory',
      title: 'Open Memory Telemetry',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=memory';
      },
    },
    {
      id: 'cmd.infrastructure.gpu',
      title: 'Open GPU Telemetry',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=gpu';
      },
    },
    {
      id: 'cmd.infrastructure.storage',
      title: 'Open Storage Explorer',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=storage';
      },
    },
    {
      id: 'cmd.infrastructure.network',
      title: 'Open Network Connections',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=network';
      },
    },
    {
      id: 'cmd.infrastructure.processes',
      title: 'Open Process Explorer',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=processes';
      },
    },
    {
      id: 'cmd.infrastructure.services',
      title: 'Open Services Monitor',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=services';
      },
    },
    {
      id: 'cmd.infrastructure.databases',
      title: 'Open Database Observability',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=databases';
      },
    },
    {
      id: 'cmd.infrastructure.containers',
      title: 'Open Container Runtime',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=containers';
      },
    },
    {
      id: 'cmd.infrastructure.health',
      title: 'Open Health & Alarms',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=health';
      },
    },
    {
      id: 'cmd.infrastructure.graph',
      title: 'Open Relationship Topology',
      category: 'navigation',
      action: () => {
        window.location.href = '/infrastructure?tab=graph';
      },
    }
  ],

  searchProviders: [
    {
      id: 'search-infrastructure-entities',
      name: 'Infrastructure Search',
      category: 'infrastructure',
      search: async (query: string) => {
        const q = query.toLowerCase();
        const results: any[] = [];

        try {
          // Fetch host info
          const hostRes = await fetch('/api/v1/infrastructure/host');
          if (hostRes.ok) {
            const host = await hostRes.json();
            if (host.hostname?.toLowerCase().includes(q)) {
              results.push({
                id: `host-${host.hostname}`,
                title: `Host: ${host.hostname}`,
                description: `OS: ${host.operatingSystem.version} | CPU: ${host.cpu.brand}`,
                href: '/infrastructure?tab=host',
                category: 'infrastructure',
                score: 1.0
              });
            }
          }

          // Fetch databases
          const dbRes = await fetch('/api/v1/infrastructure/databases');
          if (dbRes.ok) {
            const dbs = await dbRes.json();
            dbs.forEach((db: any) => {
              if (db.type.toLowerCase().includes(q) || db.location.toLowerCase().includes(q)) {
                results.push({
                  id: `db-${db.type}`,
                  title: `Database: ${db.type.toUpperCase()}`,
                  description: `Version: ${db.version} | Location: ${db.location} | Status: ${db.health}`,
                  href: '/infrastructure?tab=databases',
                  category: 'infrastructure',
                  score: 0.95
                });
              }
            });
          }

          // Fetch containers
          const containerRes = await fetch('/api/v1/infrastructure/containers');
          if (containerRes.ok) {
            const containers = await containerRes.json();
            containers.forEach((c: any) => {
              if (c.name.toLowerCase().includes(q) || c.image.toLowerCase().includes(q)) {
                results.push({
                  id: `container-${c.id}`,
                  title: `Container: ${c.name}`,
                  description: `Image: ${c.image} | State: ${c.status}`,
                  href: '/infrastructure?tab=containers',
                  category: 'infrastructure',
                  score: 0.9
                });
              }
            });
          }

          // Fetch services
          const serviceRes = await fetch('/api/v1/infrastructure/services');
          if (serviceRes.ok) {
            const services = await serviceRes.json();
            services.forEach((s: any) => {
              if (s.name.toLowerCase().includes(q) || s.displayName.toLowerCase().includes(q)) {
                results.push({
                  id: `service-${s.name}`,
                  title: `Service: ${s.displayName}`,
                  description: `Status: ${s.status} | Start Type: ${s.startType}`,
                  href: '/infrastructure?tab=services',
                  category: 'infrastructure',
                  score: 0.85
                });
              }
            });
          }

          // Fetch GPUs
          const gpuRes = await fetch('/api/v1/infrastructure/gpu');
          if (gpuRes.ok) {
            const gpus = await gpuRes.json();
            gpus.devices.forEach((dev: any) => {
              if (dev.name.toLowerCase().includes(q) || dev.vendor.toLowerCase().includes(q)) {
                results.push({
                  id: `gpu-${dev.id}`,
                  title: `GPU: ${dev.name}`,
                  description: `VRAM: ${Math.round(dev.vram.total / 1024 / 1024 / 1024)}GB | Load: ${dev.utilization}% | Temp: ${dev.temperature.current}°C`,
                  href: '/infrastructure?tab=gpu',
                  category: 'infrastructure',
                  score: 0.8
                });
              }
            });
          }

          // Fetch Storage filesystems
          const storageRes = await fetch('/api/v1/infrastructure/storage');
          if (storageRes.ok) {
            const storage = await storageRes.json();
            storage.filesystems.forEach((f: any) => {
              if (f.path.toLowerCase().includes(q) || f.type.toLowerCase().includes(q)) {
                results.push({
                  id: `fs-${f.path}`,
                  title: `Filesystem Mount: ${f.path}`,
                  description: `Type: ${f.type} | Size: ${Math.round(f.size / 1024 / 1024 / 1024)}GB | Free: ${Math.round(f.free / 1024 / 1024 / 1024)}GB`,
                  href: '/infrastructure?tab=storage',
                  category: 'infrastructure',
                  score: 0.75
                });
              }
            });
          }

          // Fetch processes (first page to search names quickly)
          const procRes = await fetch(`/api/v1/infrastructure/processes?pageSize=100&search=${encodeURIComponent(query)}`);
          if (procRes.ok) {
            const procs = await procRes.json();
            procs.data.slice(0, 10).forEach((p: any) => {
              results.push({
                id: `proc-${p.pid}`,
                title: `Process: ${p.name} (PID: ${p.pid})`,
                description: `CPU: ${p.cpuUsage}% | Memory: ${p.memoryUsage}% (${Math.round(p.memoryBytes / 1024 / 1024)}MB)`,
                href: '/infrastructure?tab=processes',
                category: 'infrastructure',
                score: 0.6
              });
            });
          }

        } catch (e) {
          console.error('[InfrastructureSearch] Search provider query failed:', e);
        }

        return results;
      }
    }
  ]
};
