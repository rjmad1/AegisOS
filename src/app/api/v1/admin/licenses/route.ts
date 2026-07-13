import { NextResponse } from 'next/server';
import { getAdminUser } from '@/platform/auth/adminAuth';
import { licenseRepository } from '@/repositories/license.repository';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const license = await licenseRepository.getLicense();
  return NextResponse.json(license);
}
