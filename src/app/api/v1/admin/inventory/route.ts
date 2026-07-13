import { NextResponse } from 'next/server';
import { getAdminUser } from '@/platform/auth/adminAuth';
import { ModuleRegistry } from '@/platform/module-registry/ModuleRegistry';
import { CommandRegistry } from '@/platform/commands/CommandRegistry';
import { WidgetRegistry } from '@/platform/widgets/WidgetRegistry';
import { auditRepository } from '@/repositories/audit.repository';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 1. Get modules
  const modules = ModuleRegistry.getAllModules().map(m => ({
    id: m.id,
    name: m.name,
    version: m.version || '1.0.0',
    description: m.description
  }));

  // 2. Get routes
  const routes = ModuleRegistry.getRoutes().map(r => ({
    path: r.path,
    moduleId: r.moduleId,
    label: r.label
  }));

  // 3. Get commands
  const commands = CommandRegistry.getAllCommands().map(c => ({
    id: c.id,
    title: c.title,
    category: c.category,
    description: c.description
  }));

  // 4. Get widgets
  const widgets = WidgetRegistry.getAllWidgets().map(w => ({
    id: w.id,
    title: w.title,
    category: w.category
  }));

  // 5. Scan databases
  let databases: string[] = [];
  try {
    const dbDir = process.env.OPS_DATABASES_DIR || path.resolve(process.cwd(), 'databases');
    const files = await fs.readdir(dbDir);
    databases = files.filter(f => f.endsWith('.json') || f.endsWith('.sqlite'));
  } catch {}

  const inventory = {
    modules,
    routes,
    commands,
    widgets,
    databases,
    apis: [
      '/api/v1/auth/login',
      '/api/v1/auth/logout',
      '/api/v1/admin/users',
      '/api/v1/admin/roles',
      '/api/v1/admin/permissions',
      '/api/v1/admin/providers',
      '/api/v1/admin/configuration',
      '/api/v1/admin/secrets',
      '/api/v1/admin/audit',
      '/api/v1/admin/jobs',
      '/api/v1/admin/backups',
      '/api/v1/admin/diagnostics',
      '/api/v1/admin/inventory',
      '/api/v1/admin/licenses',
      '/api/v1/admin/feature-flags'
    ],
    events: [
      'command:executed',
      'audit:logged',
      'navigation:favorite:added',
      'navigation:favorite:removed',
      'platform:ready'
    ],
    services: [
      'PlatformKernel',
      'ModuleRegistry',
      'CommandRegistry',
      'WidgetRegistry',
      'SearchEngine',
      'PermissionService',
      'NavigationService'
    ]
  };

  await auditRepository.logEvent(
    admin.username,
    'List Inventory',
    'administration',
    'Generated governance platform system inventory report'
  );

  return NextResponse.json(inventory);
}
