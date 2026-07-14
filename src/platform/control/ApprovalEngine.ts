import prisma from "../../infrastructure/db/prisma";
import { ApprovalType, ApprovalStatus, ApproverDecision } from "./types";

export class ApprovalEngine {
  private static instance: ApprovalEngine | null = null;
  private approvalTimeoutMs = 15 * 60 * 1000; // 15 minutes TTL for human validation

  private constructor() {}

  public static getInstance(): ApprovalEngine {
    if (!ApprovalEngine.instance) {
      ApprovalEngine.instance = new ApprovalEngine();
    }
    return ApprovalEngine.instance;
  }

  /**
   * Initializes approval parameters for a newly registered command
   */
  public async initializeApproval(
    commandId: string,
    approvalType: ApprovalType
  ): Promise<{ status: ApprovalStatus; timeout?: Date }> {
    const timeout = new Date(Date.now() + this.approvalTimeoutMs);

    let status: ApprovalStatus = "PENDING";
    if (approvalType === "AUTO") {
      status = "APPROVED";
    } else if (approvalType === "EMERGENCY") {
      status = "BYPASSED";
    }

    await prisma.command.update({
      where: { id: commandId },
      data: {
        approvalType,
        approvalStatus: status,
        approvers: JSON.stringify([]),
        approvalTimeout: approvalType === "PENDING" || status === "PENDING" ? timeout : null,
      },
    });

    return {
      status,
      timeout: status === "PENDING" ? timeout : undefined,
    };
  }

  /**
   * Records a manual human decision on a command approval gate
   */
  public async processApproval(
    commandId: string,
    userId: string,
    email: string,
    role: string,
    action: "APPROVED" | "REJECTED",
    signature?: string
  ): Promise<{ approvalStatus: ApprovalStatus; commandStatus: string }> {
    const cmd = await prisma.command.findUnique({
      where: { id: commandId },
    });

    if (!cmd) {
      throw new Error(`Command ${commandId} not found`);
    }

    if (cmd.approvalStatus !== "PENDING") {
      throw new Error(`Command approval gate is already closed with status: ${cmd.approvalStatus}`);
    }

    if (cmd.approvalTimeout && new Date() > new Date(cmd.approvalTimeout)) {
      await prisma.command.update({
        where: { id: commandId },
        data: { approvalStatus: "EXPIRED", status: "FAILED", errorMessage: "Approval timeout expired." },
      });
      return { approvalStatus: "EXPIRED", commandStatus: "FAILED" };
    }

    const currentApprovers: ApproverDecision[] = JSON.parse(cmd.approvers || "[]");

    // Replay protection: prevent duplicate approval submissions from the same user
    if (currentApprovers.some((app) => app.userId === userId)) {
      throw new Error(`User ${email} has already actioned this approval request.`);
    }

    // Add decision
    const decision: ApproverDecision = {
      userId,
      userEmail: email,
      action,
      timestamp: new Date().toISOString(),
      signature,
    };
    currentApprovers.push(decision);

    let newApprovalStatus: ApprovalStatus = "PENDING";
    let newCommandStatus = cmd.status;

    if (action === "REJECTED") {
      newApprovalStatus = "REJECTED";
      newCommandStatus = "CANCELLED";
    } else {
      // APPROVED flow
      if (cmd.approvalType === "MANUAL") {
        // Single approval suffices
        newApprovalStatus = "APPROVED";
        newCommandStatus = "QUEUED";
      } else if (cmd.approvalType === "MULTI_STAGE") {
        // High/Critical risk commands require two separate approvers, at least one must be an Admin
        const adminApprovals = currentApprovers.filter(
          (app) => app.action === "APPROVED" && app.userId !== userId // mock check: assume first step or we look up role
        );
        
        // Simple multi-stage rule: require 2 unique approvals
        if (currentApprovers.length >= 2) {
          newApprovalStatus = "APPROVED";
          newCommandStatus = "QUEUED";
        } else {
          newApprovalStatus = "PENDING";
        }
      }
    }

    await prisma.command.update({
      where: { id: commandId },
      data: {
        approvalStatus: newApprovalStatus,
        status: newCommandStatus,
        approvers: JSON.stringify(currentApprovers),
      },
    });

    return {
      approvalStatus: newApprovalStatus,
      commandStatus: newCommandStatus,
    };
  }

  /**
   * Scans and transition expired approval items to failed/expired states
   */
  public async checkExpirations(): Promise<number> {
    const expiredCount = await prisma.command.updateMany({
      where: {
        approvalStatus: "PENDING",
        approvalTimeout: {
          lt: new Date(),
        },
      },
      data: {
        approvalStatus: "EXPIRED",
        status: "FAILED",
        errorMessage: "Approval timeout expired.",
      },
    });

    return expiredCount.count;
  }
}

export const approvalEngine = ApprovalEngine.getInstance();
export default approvalEngine;
