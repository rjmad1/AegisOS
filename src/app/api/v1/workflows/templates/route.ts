import { NextRequest } from "next/server";
import { workflowRepository } from "@/repositories/workflow.repository";

export async function GET(request: NextRequest) {
  try {
    const list = await workflowRepository.getTemplates();
    return Response.json(list);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, version, nodes, metadata } = body;
    if (!id || !name) {
      return Response.json({ error: "Missing required fields: id and name" }, { status: 400 });
    }
    const tpl = {
      id,
      name,
      description: description || "",
      version: version || "1.0.0",
      nodes: nodes || [],
      metadata: metadata || {}
    };
    await workflowRepository.saveTemplate(tpl);
    return Response.json({ success: true, template: tpl }, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
