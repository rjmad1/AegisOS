import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const anchorStr = searchParams.get('anchor');
    const anchor = anchorStr ? parseInt(anchorStr, 10) : 0;

    // Fetch approvals created or updated after anchor
    const approvals = await prisma.workflowApproval.findMany({
      where: {
        createdAt: {
          gt: anchor > 0 ? new Date(anchor).toISOString() : '1970-01-01T00:00:00.000Z'
        }
      }
    });

    // Mapped response payload according to the mobile sync contract
    const syncPayload = {
      nextAnchor: Date.now(),
      changes: {
        conversations: [], // Mock empty list as conversations are handled inside v1 app runtime
        approvals: approvals.map((app) => ({
          id: app.id,
          executionId: app.executionId,
          nodeId: app.nodeId,
          workflowName: app.workflowName,
          command: app.escalationUser || 'run command', // fallback if empty
          status: app.status === 'pending' ? 'Pending' : app.status === 'approved' ? 'Approved' : app.status === 'rejected' ? 'Rejected' : 'TimedOut',
          riskLevel: app.type === 'quorum' ? 'High' : 'Medium',
          createdAt: app.createdAt
        })),
        notifications: []
      }
    };

    return NextResponse.json(syncPayload, {
      headers: {
        'X-RateLimit-Limit': '4',
        'X-RateLimit-Remaining': '3',
        'X-RateLimit-Reset': Math.floor((Date.now() + 60000) / 1000).toString()
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      code: 'ERR_SYNC_FAILED',
      message: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
