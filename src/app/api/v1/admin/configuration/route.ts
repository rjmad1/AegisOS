import { NextResponse } from 'next/server';
import { getAdminUser } from '@/platform/auth/adminAuth';
import { configRepository, PlatformConfig } from '@/repositories/config.repository';
import { auditRepository } from '@/repositories/audit.repository';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const config = await configRepository.getActiveConfig();
  const history = await configRepository.getHistory();

  await auditRepository.logEvent(
    admin.username,
    'Read Configuration',
    'configuration',
    'Retrieved platform configurations and history'
  );

  return NextResponse.json({ config, history });
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Check if it's a revert request
    if (body.action === 'revert') {
      const version = parseInt(body.version, 10);
      if (isNaN(version)) {
        return NextResponse.json({ error: 'Invalid version number' }, { status: 400 });
      }
      const newConfig = await configRepository.revertToVersion(version, admin.username);
      if (!newConfig) {
        return NextResponse.json({ error: `Version ${version} not found` }, { status: 404 });
      }
      return NextResponse.json({ success: true, config: newConfig });
    }

    const { config, notes } = body;
    if (!config) {
      return NextResponse.json({ error: 'Missing configuration payload' }, { status: 400 });
    }

    const validation = configRepository.validateConfig(config);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
    }

    await configRepository.saveConfig(config, admin.username, notes || 'Configuration updated via administrative portal');
    await auditRepository.logEvent(
      admin.username,
      'Update Configuration',
      'configuration',
      `Configuration updated: ${notes || 'Updated settings'}`
    );

    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
