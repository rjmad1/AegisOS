import { NextResponse } from 'next/server';
import { getAdminUser } from '@/platform/auth/adminAuth';
import { ProviderRegistry } from '@/infrastructure/providers/registry';
import { adminService } from "@/services/admin.service";
import fs from 'fs/promises';
import path from 'path';

const STATUS_FILE_PATH = process.env.OPS_DATABASES_DIR
  ? path.join(process.env.OPS_DATABASES_DIR, 'providers_status.json')
  : path.join(process.cwd(), 'databases', 'providers_status.json');

async function getProviderStatuses(): Promise<Record<string, boolean>> {
  try {
    await fs.mkdir(path.dirname(STATUS_FILE_PATH), { recursive: true });
    const data = await fs.readFile(STATUS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveProviderStatus(id: string, enabled: boolean): Promise<void> {
  const statuses = await getProviderStatuses();
  statuses[id] = enabled;
  await fs.writeFile(STATUS_FILE_PATH, JSON.stringify(statuses, null, 2), 'utf-8');
}

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const providers = ProviderRegistry.getInstance().getAllProviders();
  const statuses = await getProviderStatuses();

  const data = providers.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    registrationStatus: 'Registered',
    enabled: statuses[p.id] !== false, // default enabled
    health: 'healthy',
    capabilities: ['Inference', 'Telemetry', 'System Queries'].slice(0, Math.floor(Math.random() * 3) + 1),
    dependencies: p.type.startsWith('cpu') || p.type.startsWith('gpu') ? ['OS Telemetry'] : [],
    version: '1.0.0'
  }));

  await adminService.audit.logEvent(
    admin.username,
    'List Providers',
    'provider',
    'Retrieved registered infrastructure providers'
  );

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, enabled } = body;
    if (!id || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Missing id or enabled flag' }, { status: 400 });
    }

    await saveProviderStatus(id, enabled);
    await adminService.audit.logEvent(
      admin.username,
      enabled ? 'Enable Provider' : 'Disable Provider',
      'provider',
      `Infrastructure provider "${id}" status changed to: ${enabled ? 'Enabled' : 'Disabled'}`
    );

    return NextResponse.json({ success: true, id, enabled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
