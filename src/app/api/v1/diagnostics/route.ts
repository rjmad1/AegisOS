import { NextResponse } from "next/server";
import { selfHealer } from "@/infrastructure/diagnostics/self-healer";
import { executionRuntimeService } from "@/services/execution-runtime.service";

export async function GET() {
  try {
    const uExec = await executionRuntimeService.createExecution(
      "Run diagnostics and self-healing cycle",
      { userId: "system-diagnostics", role: "admin" }
    );
    await executionRuntimeService.validateExecution(uExec.executionId);
    await executionRuntimeService.recordTimelineEvent(uExec.executionId, "Started", "diagnostics", "diagnostics-endpoint");

    try {
      const report = await selfHealer.executeDiagnosticsAndHeal();
      uExec.metadata.report = report;
      await executionRuntimeService.recordTimelineEvent(uExec.executionId, "Completed", "diagnostics", "diagnostics-endpoint");
      await executionRuntimeService.completeExecution(uExec.executionId);
      return NextResponse.json(report);
    } catch (err: any) {
      await executionRuntimeService.failExecution(uExec.executionId, err.message);
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const uExec = await executionRuntimeService.createExecution(
      "Run diagnostics and self-healing cycle",
      { userId: "system-diagnostics", role: "admin" }
    );
    await executionRuntimeService.validateExecution(uExec.executionId);
    await executionRuntimeService.recordTimelineEvent(uExec.executionId, "Started", "diagnostics", "diagnostics-endpoint");

    try {
      const report = await selfHealer.executeDiagnosticsAndHeal();
      uExec.metadata.report = report;
      await executionRuntimeService.recordTimelineEvent(uExec.executionId, "Completed", "diagnostics", "diagnostics-endpoint");
      await executionRuntimeService.completeExecution(uExec.executionId);
      return NextResponse.json({
        success: true,
        message: "Self-healing loop triggered and completed.",
        report
      });
    } catch (err: any) {
      await executionRuntimeService.failExecution(uExec.executionId, err.message);
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
