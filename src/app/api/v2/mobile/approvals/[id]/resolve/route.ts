import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { decision, deviceSignature } = body;

    if (!decision || !['Approved', 'Rejected'].includes(decision)) {
      return NextResponse.json({
        code: 'ERR_INVALID_DECISION',
        message: 'Decision must be Approved or Rejected.'
      }, { status: 400 });
    }

    // Check if the approval exists
    const approval = await prisma.workflowApproval.findUnique({
      where: { id }
    });

    if (!approval) {
      return NextResponse.json({
        code: 'ERR_APPROVAL_NOT_FOUND',
        message: `Approval item ${id} was not found.`
      }, { status: 404 });
    }

    if (approval.status !== 'pending') {
      return NextResponse.json({
        code: 'ERR_APPROVAL_RESOLVED',
        message: `Approval ${id} is already in state: ${approval.status}`
      }, { status: 409 });
    }

    // Update state in PostgreSQL DB
    const updatedStatus = decision === 'Approved' ? 'approved' : 'rejected';
    await prisma.workflowApproval.update({
      where: { id },
      data: {
        status: updatedStatus,
        actionedAt: new Date().toISOString(),
        decisions: JSON.stringify({
          signature: deviceSignature,
          resolvedBy: 'mobile_companion'
        })
      }
    });

    return NextResponse.json({ status: 'Dispatched' });
  } catch (err: any) {
    return NextResponse.json({
      code: 'ERR_APPROVALS_RESOLVE',
      message: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
