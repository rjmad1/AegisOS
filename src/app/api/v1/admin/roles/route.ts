import { NextResponse } from 'next/server';
import { getAdminUser } from '@/platform/auth/adminAuth';
import { adminService } from "@/services/admin.service";
import { Role } from '@/platform/auth/authorization';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const matrix = await adminService.roles.getRolePermissions();
  await adminService.audit.logEvent(
    admin.username,
    'List Roles',
    'administration',
    'Retrieved roles and permissions mapping matrix'
  );

  return NextResponse.json(matrix);
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { role, permissions } = body;
    if (!role || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Missing role or permissions array' }, { status: 400 });
    }

    await adminService.roles.saveRolePermissions(role as Role, permissions);
    await adminService.audit.logEvent(
      admin.username,
      'Update Role Permissions',
      'authorization',
      `Permissions for role ${role} updated: [${permissions.join(', ')}]`
    );

    return NextResponse.json({ success: true, role, permissions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
