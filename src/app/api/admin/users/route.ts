import { NextResponse } from 'next/server';
import { adminService } from "@/services/admin.service";
import { Role } from '../../../../platform/auth/authorization';

export async function GET(request: Request) {
  const users = await adminService.users.getAllUsers();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.email || !body.role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = body.id || crypto.randomUUID();
    const user = {
      id: userId,
      googleSubjectId: body.googleSubjectId || `manual_${userId}`,
      email: body.email,
      displayName: body.displayName || body.email.split('@')[0],
      role: body.role as Role,
      status: body.status || 'Enabled',
      createdDate: body.createdDate || new Date().toISOString(),
      lastLogin: body.lastLogin || null,
      createdBy: body.createdBy || 'System',
      permissions: body.permissions || [],
      allowedNetworks: body.allowedNetworks || [],
      notes: body.notes || ''
    };

    await adminService.users.saveUser(user);
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
