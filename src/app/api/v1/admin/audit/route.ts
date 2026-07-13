import { NextResponse } from 'next/server';
import { getAdminUser } from '@/platform/auth/adminAuth';
import { auditRepository } from '@/repositories/audit.repository';

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || undefined;
  const category = (searchParams.get('category') as any) || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const logs = await auditRepository.getLogs({
    query,
    category,
    startDate,
    endDate
  });

  return NextResponse.json(logs);
}
