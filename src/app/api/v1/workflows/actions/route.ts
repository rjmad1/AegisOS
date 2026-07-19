import { NextRequest } from "next/server";
import { ProviderRegistry } from "@/infrastructure/sdk/platform-sdk";

export async function GET(request: NextRequest) {
  let providerCalls: any[] = [];
  try {
    const providers = ProviderRegistry.getInstance().getAllProviders();
    providerCalls = providers.map(p => ({
      type: "provider_call",
      name: `Call ${p.name}`,
      description: `Invoke method on provider: ${p.id} (${p.type})`,
      config: { providerId: p.id }
    }));
  } catch (err) {
    console.error("[ActionsAPI] Failed to retrieve providers:", err);
  }

  const baseActions = [
    { type: "notification", name: "Notify User", description: "Send UI notification to console alert system" },
    { type: "script", name: "Run Custom Script", description: "Execute sandboxed JavaScript code snippet" },
    { type: "sub_workflow", name: "Invoke Sub-workflow", description: "Run another workflow as a child pipeline" },
    { type: "delay", name: "Execution Delay", description: "Pause workflow execution for a period of time" },
    { type: "approval", name: "Request Approval Gate", description: "Require human verification to continue execution" }
  ];

  return Response.json([...baseActions, ...providerCalls]);
}
