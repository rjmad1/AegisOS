import { NextRequest } from "next/server";
import { workflowRepository } from "@/repositories/workflow.repository";

export async function GET(request: NextRequest) {
  try {
    const list = await workflowRepository.getHistories();
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return Response.json(list);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
