import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import prisma from "@/infrastructure/db/prisma";
import { policyEngine } from "@/platform/control/PolicyEngine";
import { approvalEngine } from "@/platform/control/ApprovalEngine";
import { auditEngine } from "@/platform/control/AuditEngine";
import { rollbackEngine } from "@/platform/control/RollbackEngine";
import { executionEngine } from "@/platform/control/ExecutionEngine";
import { commandBus } from "@/platform/control/CommandBus";

describe("Command & Control Subsystem Engine Tests", () => {
  const testUser = { id: "test-user-id", email: "operator@aegis-os.local", role: "Operator" };
  const testAdmin = { id: "admin-user-id", email: "admin@aegis-os.local", role: "Administrator" };

  beforeEach(async () => {
    // Clear commands list in database before each test
    await prisma.command.deleteMany({});
  });

  // 1. Policy Engine Checks
  describe("Policy Engine Validation", () => {
    it("should classify risk levels accurately based on command types", () => {
      expect(policyEngine.determineRiskLevel("ai:load_model")).toBe("LOW");
      expect(policyEngine.determineRiskLevel("infrastructure:restart_service")).toBe("MEDIUM");
      expect(policyEngine.determineRiskLevel("system:sleep")).toBe("HIGH");
      expect(policyEngine.determineRiskLevel("system:shutdown")).toBe("CRITICAL");
    });

    it("should authorize low risk commands for Operators", () => {
      const auth = policyEngine.validatePolicy(
        { type: "ai:load_model", payload: {}, origin: "console" },
        "Operator",
        "LOW"
      );
      expect(auth.authorized).toBe(true);
    });

    it("should reject Viewer roles from executing mutating commands", () => {
      const auth = policyEngine.validatePolicy(
        { type: "ai:load_model", payload: {}, origin: "console" },
        "Viewer",
        "LOW"
      );
      expect(auth.authorized).toBe(false);
      expect(auth.reason).toContain("does not possess operational execute permissions");
    });
  });

  // 2. Command Bus Security Gates (Replay Protection & Nonces)
  describe("Command Bus Security Gates", () => {
    it("should reject expired timestamps due to clock skew check", async () => {
      await expect(
        commandBus.dispatch(
          {
            type: "ai:load_model",
            payload: {},
            origin: "console",
            timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
          },
          testUser
        )
      ).rejects.toThrow("Timestamp is expired");
    });

    it("should reject duplicate replay nonces", async () => {
      const nonce = "test-unique-nonce-123";
      
      // Dispatch first time (should succeed)
      const res = await commandBus.dispatch(
        {
          type: "ai:load_model",
          payload: {},
          origin: "console",
          replayNonce: nonce,
          timestamp: Date.now(),
        },
        testUser
      );
      expect(res.commandId).toBeDefined();

      // Dispatch second time with same nonce (should fail)
      await expect(
        commandBus.dispatch(
          {
            type: "ai:load_model",
            payload: {},
            origin: "console",
            replayNonce: nonce,
            timestamp: Date.now(),
          },
          testUser
        )
      ).rejects.toThrow("Duplicate nonce detected");
    });
  });

  // 3. Approval Engine States
  describe("Approval Engine Pipeline", () => {
    it("should auto-approve LOW risk commands", async () => {
      const res = await commandBus.dispatch(
        {
          type: "ai:load_model",
          payload: {},
          origin: "console",
          timestamp: Date.now(),
        },
        testUser
      );

      expect(res.approvalStatus).toBe("APPROVED");
      expect(res.status).toBe("QUEUED"); // Enqueued directly
    });

    it("should hold MEDIUM risk commands in PENDING_APPROVAL status", async () => {
      const res = await commandBus.dispatch(
        {
          type: "infrastructure:restart_service",
          payload: { serviceId: "litellm" },
          origin: "console",
          timestamp: Date.now(),
        },
        testUser
      );

      expect(res.approvalStatus).toBe("PENDING");
      expect(res.status).toBe("PENDING_APPROVAL");
    });

    it("should release held commands upon receiving human approval", async () => {
      const res = await commandBus.dispatch(
        {
          type: "infrastructure:restart_service",
          payload: { serviceId: "litellm" },
          origin: "console",
          timestamp: Date.now(),
        },
        testUser
      );

      const decision = await approvalEngine.processApproval(
        res.commandId,
        testAdmin.id,
        testAdmin.email,
        testAdmin.role,
        "APPROVED"
      );

      expect(decision.approvalStatus).toBe("APPROVED");
      expect(decision.commandStatus).toBe("QUEUED");

      const dbCmd = await prisma.command.findUnique({ where: { id: res.commandId } });
      expect(dbCmd?.status).toBe("QUEUED");
    });

    it("should cancel commands upon receiving rejection decisions", async () => {
      const res = await commandBus.dispatch(
        {
          type: "infrastructure:restart_service",
          payload: { serviceId: "litellm" },
          origin: "console",
          timestamp: Date.now(),
        },
        testUser
      );

      const decision = await approvalEngine.processApproval(
        res.commandId,
        testAdmin.id,
        testAdmin.email,
        testAdmin.role,
        "REJECTED"
      );

      expect(decision.approvalStatus).toBe("REJECTED");
      expect(decision.commandStatus).toBe("CANCELLED");

      const dbCmd = await prisma.command.findUnique({ where: { id: res.commandId } });
      expect(dbCmd?.status).toBe("CANCELLED");
    });
  });

  // 4. Execution Workers, Priority Queue, and Retries
  describe("Execution & Queue Workers", () => {
    it("should process enqueued commands based on priority level", async () => {
      // Seed low priority command first
      const lowRes = await commandBus.dispatch(
        {
          type: "ai:load_model",
          priority: "LOW",
          payload: { modelId: "ollama:gemma2:9b" },
          origin: "console",
          timestamp: Date.now(),
        },
        testUser
      );

      // Seed critical priority command second
      const critRes = await commandBus.dispatch(
        {
          type: "ai:load_model",
          priority: "CRITICAL",
          payload: { modelId: "ollama:gemma2:9b" },
          origin: "console",
          timestamp: Date.now(),
        },
        testUser
      );

      // Trigger queue run
      await executionEngine.processQueue();

      // Verify that the critical command was executed and completed first, while the low one is still queued
      const critCmd = await prisma.command.findUnique({ where: { id: critRes.commandId } });
      const lowCmd = await prisma.command.findUnique({ where: { id: lowRes.commandId } });

      expect(critCmd?.status).toBe("COMPLETED");
      expect(lowCmd?.status).toBe("QUEUED");
    });

    it("should retry failed commands with backoff policies up to max limits", async () => {
      // Dispatch a command that will fail (e.g. invalid service id)
      const res = await commandBus.dispatch(
        {
          type: "infrastructure:start_service",
          payload: { serviceId: "" }, // Empty service triggers error
          origin: "console",
          timestamp: Date.now(),
        },
        testAdmin // Admin bypasses approval, goes straight to QUEUED
      );

      // Run queue 1st attempt (fails, schedules retry)
      await executionEngine.processQueue();

      let cmdState = await prisma.command.findUnique({ where: { id: res.commandId } });
      expect(cmdState?.status).toBe("QUEUED");
      expect(cmdState?.retryCount).toBe(1);
      expect(cmdState?.nextAttemptAt).toBeDefined();

      // Force next attempt immediately
      await prisma.command.update({
        where: { id: res.commandId },
        data: { nextAttemptAt: null },
      });

      // Run queue 2nd attempt (fails)
      await executionEngine.processQueue();
      cmdState = await prisma.command.findUnique({ where: { id: res.commandId } });
      expect(cmdState?.retryCount).toBe(2);

      // Force next attempt
      await prisma.command.update({
        where: { id: res.commandId },
        data: { nextAttemptAt: null },
      });

      // Run queue 3rd attempt (fails)
      await executionEngine.processQueue();
      cmdState = await prisma.command.findUnique({ where: { id: res.commandId } });
      expect(cmdState?.retryCount).toBe(3);

      // Force next attempt
      await prisma.command.update({
        where: { id: res.commandId },
        data: { nextAttemptAt: null },
      });

      // Run queue 4th attempt (exceeds max limit 3, shunted to FAILED/DLQ)
      await executionEngine.processQueue();
      cmdState = await prisma.command.findUnique({ where: { id: res.commandId } });
      expect(cmdState?.status).toBe("FAILED");
      expect(cmdState?.errorMessage).toContain("Max retries");
    });
  });

  // 5. Rollback Engine Verification
  describe("Rollback Engine", () => {
    it("should rollback completed actions via registered rollback payload", async () => {
      // 1. Submit and execute a service start command
      const res = await commandBus.dispatch(
        {
          type: "infrastructure:start_service",
          payload: { serviceId: "ollama" },
          origin: "console",
          timestamp: Date.now(),
        },
        testAdmin
      );

      await executionEngine.processQueue();

      let cmd = await prisma.command.findUnique({ where: { id: res.commandId } });
      expect(cmd?.status).toBe("COMPLETED");
      expect(cmd?.rollbackPayload).toBeDefined();

      // 2. Trigger rollback
      const rollbackRes = await rollbackEngine.executeRollback(res.commandId, "operator");
      expect(rollbackRes.success).toBe(true);

      // Verify that status changed to ROLLED_BACK
      cmd = await prisma.command.findUnique({ where: { id: res.commandId } });
      expect(cmd?.status).toBe("ROLLED_BACK");
      expect(cmd?.rolledBackBy).toBe("operator");
    });
  });
});
