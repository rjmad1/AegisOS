import { HumanApprovalRequest } from "./types";
import { EventBus } from "../event-bus/EventBus";

export class HumanCollaborationLayer {
  private static instance: HumanCollaborationLayer | null = null;
  private approvals: Map<string, HumanApprovalRequest> = new Map();

  private constructor() {}

  public static getInstance(): HumanCollaborationLayer {
    if (!HumanCollaborationLayer.instance) {
      HumanCollaborationLayer.instance = new HumanCollaborationLayer();
    }
    return HumanCollaborationLayer.instance;
  }

  public getApprovals(): HumanApprovalRequest[] {
    return Array.from(this.approvals.values());
  }

  public getPendingApprovals(): HumanApprovalRequest[] {
    return this.getApprovals().filter((a) => a.status === "pending");
  }

  /**
   * Creates a new human-in-the-loop approval ticket and publishes an alert event.
   */
  public async requestApproval(
    description: string,
    executionId: string,
    stepId: string,
    assignedTo: string[] = ["administrator"]
  ): Promise<HumanApprovalRequest> {
    const id = `approval:${executionId}:${stepId}:${Date.now()}`;
    const req: HumanApprovalRequest = {
      id,
      executionId,
      stepId,
      requestType: "approval",
      description,
      requestedBy: "agent:supervisor",
      assignedTo,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    this.approvals.set(id, req);

    // Publish to system-wide event bus
    EventBus.publish("notifications:publish" as any, {
      id: `notify:${id}`,
      title: "Human Approval Requested",
      message: `Step ${stepId} requires review: ${description}`,
      type: "warning",
      timestamp: Date.now(),
    });

    console.log(`[HumanCollaborationLayer] Created Approval Request ${id}: "${description}"`);
    return req;
  }

  /**
   * Submits a user decision (Approve/Reject) on a pending ticket, triggering resolution hooks.
   */
  public decideApproval(
    id: string,
    decision: "approved" | "rejected",
    comments?: string,
    overridePayload?: any
  ): void {
    const req = this.approvals.get(id);
    if (!req) {
      throw new Error(`HumanCollaborationLayer: Approval ticket "${id}" not found.`);
    }

    if (req.status !== "pending") {
      throw new Error(`HumanCollaborationLayer: Ticket "${id}" is already resolved.`);
    }

    req.status = decision === "approved" ? "approved" : "rejected";
    req.decisionDetails = {
      approvedBy: "usr-admin-01",
      overridePayload,
      feedbackComments: comments,
      timestamp: new Date().toISOString(),
    };

    // Emit event on resolution
    EventBus.publish("notifications:publish" as any, {
      id: `notify:${id}:resolved`,
      title: "Approval Resolved",
      message: `Approval request ${id} was ${decision.toUpperCase()} by Administrator.`,
      type: decision === "approved" ? "info" : "error",
      timestamp: Date.now(),
    });

    console.log(`[HumanCollaborationLayer] Decided Ticket ${id} as: ${decision.toUpperCase()}`);
  }
}
export default HumanCollaborationLayer;
