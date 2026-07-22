import { NextRequest } from "next/server";
import { workflowService } from "@/services/workflow.service";
import { formatErrorResponse } from "@/utils/api-helper";
import { ValidationError, NotFoundError } from "@/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const list = await workflowService.getApprovals();
    list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Response.json(list);
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, approvalId, approverId, decision, delegateTo } = body;

    if (!approvalId || !approverId) {
      throw new ValidationError("Missing required fields: approvalId, approverId");
    }

    const approval = await workflowService.getApproval(approvalId);
    if (!approval) {
      throw new NotFoundError("Approval request not found");
    }

    if (action === "decide") {
      if (decision !== "approved" && decision !== "rejected") {
        throw new ValidationError("Decision must be 'approved' or 'rejected'");
      }
      const updated = await workflowService.actionApproval(approvalId, approverId, decision);
      return Response.json({ success: true, approval: updated });
    }

    if (action === "delegate") {
      if (!delegateTo) {
        throw new ValidationError("Missing delegateTo user");
      }
      approval.status = "delegated";
      approval.delegatedTo = delegateTo;
      approval.actionedAt = new Date().toISOString();
      await workflowService.saveApproval(approval);

      // Create new approval for the delegated user
      const delegatedApproval = {
        ...approval,
        id: `app-${Math.random().toString(36).substring(2, 8)}`,
        approvers: [delegateTo],
        status: "pending" as const,
        decisions: {},
        createdAt: new Date().toISOString(),
        actionedAt: undefined,
        delegatedTo: undefined
      };
      await workflowService.saveApproval(delegatedApproval);

      return Response.json({ success: true, approval, delegatedApproval });
    }

    throw new ValidationError(`Invalid action: ${action}`);
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}
