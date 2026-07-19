import { NextResponse } from 'next/server';
import { getAdminUser } from '@/platform/auth/adminAuth';
import { adminService } from "@/services/admin.service";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const jobs = await adminService.jobs.getAllJobs();
  return NextResponse.json(jobs);
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing job ID' }, { status: 400 });
    }

    const triggered = await adminService.jobs.triggerJobImmediately(id);
    if (!triggered) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    await adminService.audit.logEvent(
      admin.username,
      'Trigger Job',
      'administration',
      `Manual scheduler job trigger executed for: "${triggered.name}"`
    );

    return NextResponse.json({ success: true, job: triggered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
