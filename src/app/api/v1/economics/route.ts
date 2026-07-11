import { NextResponse } from "next/server";
import { economicsManager } from "@/infrastructure/economics/economics-manager";

export async function GET() {
  const summary = economicsManager.getSummary();
  return NextResponse.json(summary);
}
