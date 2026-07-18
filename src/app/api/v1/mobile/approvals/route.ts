import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const approvals = await prisma.workflowApproval.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(approvals);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { approvalId, action } = await req.json();
    const approval = await prisma.workflowApproval.findUnique({
      where: { id: approvalId },
    });
    if (!approval) {
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    await prisma.workflowApproval.update({
      where: { id: approvalId },
      data: {
        status: action === "approved" ? "approved" : "rejected",
        actionedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, status: action });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
