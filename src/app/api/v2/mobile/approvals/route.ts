import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const approvals = await prisma.workflowApproval.findMany({
      where: { status: 'pending' }
    });

    const mapped = approvals.map((app) => ({
      id: app.id,
      executionId: app.executionId,
      nodeId: app.nodeId,
      workflowName: app.workflowName,
      command: app.escalationUser || 'system task',
      status: 'Pending',
      riskLevel: 'Medium',
      createdAt: app.createdAt
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    return NextResponse.json({
      code: 'ERR_APPROVALS_FETCH',
      message: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
