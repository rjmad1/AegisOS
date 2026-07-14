import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../route";
import { rollbackEngine } from "@/platform/control/RollbackEngine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid session credentials" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await rollbackEngine.executeRollback(id, user.email || "operator");
    if (!result.success) {
      return NextResponse.json({ error: "ROLLBACK_FAILED", message: result.message }, { status: 400 });
    }
    return NextResponse.json({ status: "ROLLED_BACK", result: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
