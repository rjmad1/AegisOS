import { NextRequest } from "next/server";
import { runtimeService } from "@/services/runtime.service";
import { workflowService } from "@/services/workflow.service";
import { handleCaching, formatErrorResponse } from "@/utils/api-helper";
import { ValidationError } from "@/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";

    const result = await runtimeService.getWorkflows({ page, limit, search });
    return handleCaching(request, result);
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, version, nodes, capabilities, dependencies, relationships, metadata } = body;
    
    if (!id || !name) {
      throw new ValidationError("Missing required fields: id and name");
    }

    const newWf = {
      id,
      name,
      description: description || "",
      version: version || "1.0.0",
      status: "draft" as const,
      nodes: nodes || [],
      capabilities: capabilities || [],
      dependencies: dependencies || [],
      relationships: relationships || [],
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await workflowService.saveWorkflow(newWf);
    return Response.json({ success: true, workflow: newWf }, { status: 201 });
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}
