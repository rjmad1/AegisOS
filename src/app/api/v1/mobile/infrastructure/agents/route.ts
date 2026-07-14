// src/app/api/v1/mobile/infrastructure/agents/route.ts
// REST endpoint for mobile client querying active agent profiles and state metrics

import { NextResponse } from "next/server";
import { AgentRuntime } from "@/platform/ai-runtime/AgentRuntime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const agentRuntime = AgentRuntime.getInstance();
    const agentsList = agentRuntime.getAgents();

    const agents = agentsList.map((agent) => {
      const state = agentRuntime.getAgentState(agent.id);
      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        systemPrompt: agent.systemPrompt,
        allowedModels: agent.allowedModels,
        allowedTools: agent.allowedTools,
        permissions: agent.permissions,
        isolationLevel: agent.isolationLevel,
        version: agent.version,
        state: state?.state || "idle",
        lastActive: state?.lastActive || new Date().toISOString(),
        metrics: {
          invocations: state?.metrics.invocations || 0,
          tokensConsumed: state?.metrics.tokensConsumed || 0,
          runningCostUsd: state?.metrics.runningCostUsd || 0.0,
          errorCount: state?.metrics.errorCount || 0
        }
      };
    });

    return NextResponse.json(agents);
  } catch (err: any) {
    console.error("[MobileAgentsAPIError]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
