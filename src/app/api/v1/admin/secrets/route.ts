import { NextResponse } from 'next/server';
import { getAdminUser } from '@/platform/auth/adminAuth';
import { adminService } from "@/services/admin.service";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const secrets = await adminService.secrets.getAllSecrets();
  
  // Return ONLY keys and masked placeholders to prevent exposure
  const masked = secrets.map(s => ({
    key: s.key,
    value: '********',
    updatedAt: s.updatedAt
  }));

  // Populate default keys if empty
  if (masked.length === 0) {
    const defaultKeys = [
      { key: 'GOOGLE_OAUTH_CLIENT_ID', value: '********', updatedAt: new Date().toISOString() },
      { key: 'GOOGLE_OAUTH_CLIENT_SECRET', value: '********', updatedAt: new Date().toISOString() },
      { key: 'JWT_SIGNING_SECRET', value: '********', updatedAt: new Date().toISOString() },
      { key: 'LITELLM_API_KEY', value: '********', updatedAt: new Date().toISOString() }
    ];
    return NextResponse.json(defaultKeys);
  }

  await adminService.audit.logEvent(
    admin.username,
    'List Secret Keys',
    'security',
    'Viewed registered secret keys list'
  );

  return NextResponse.json(masked);
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { key, value } = body;
    if (!key || !value) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }

    await adminService.secrets.saveSecret(key, value);
    await adminService.audit.logEvent(
      admin.username,
      'Save Secret',
      'security',
      `Encrypted and saved secret key: "${key}"`
    );

    return NextResponse.json({ success: true, key });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    await adminService.secrets.deleteSecret(key);
    await adminService.audit.logEvent(
      admin.username,
      'Delete Secret',
      'security',
      `Deleted secret key: "${key}"`
    );

    return NextResponse.json({ success: true, key });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
