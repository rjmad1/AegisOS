import { NextResponse } from 'next/server';
import { getAdminUser } from '@/platform/auth/adminAuth';
import { userRepository } from '@/repositories/user.repository';
import { auditRepository } from '@/repositories/audit.repository';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await userRepository.getAllUsers();
  await auditRepository.logEvent(
    admin.username,
    'List Users',
    'administration',
    'Retrieved list of authorized users'
  );

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.email || !body.role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await userRepository.getUserByEmail(body.email);
    const userId = body.id || (existing ? existing.id : crypto.randomUUID());
    const user = {
      id: userId,
      googleSubjectId: body.googleSubjectId || (existing ? existing.googleSubjectId : `manual_${userId}`),
      email: body.email,
      displayName: body.displayName || body.email.split('@')[0],
      role: body.role,
      status: body.status || 'Enabled',
      createdDate: body.createdDate || (existing ? existing.createdDate : new Date().toISOString()),
      lastLogin: body.lastLogin || (existing ? existing.lastLogin : null),
      createdBy: body.createdBy || admin.username,
      permissions: body.permissions || (existing ? existing.permissions : []),
      allowedNetworks: body.allowedNetworks || (existing ? existing.allowedNetworks : []),
      notes: body.notes || ''
    };

    await userRepository.saveUser(user);
    await auditRepository.logEvent(
      admin.username,
      existing ? 'Update User' : 'Create User',
      'administration',
      `User ${user.email} was ${existing ? 'updated' : 'created'} with role ${user.role}`
    );

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
