import { NextRequest } from "next/server";
import { workflowService } from "@/services/workflow.service";

export async function GET(request: NextRequest) {
  try {
    const list = await workflowService.getHistories();
    list.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return Response.json(list);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
