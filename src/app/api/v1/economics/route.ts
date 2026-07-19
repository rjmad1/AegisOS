import { NextResponse } from "next/server";
import { economicsManager } from "@/infrastructure/sdk/platform-sdk";

export async function GET() {
  const summary = economicsManager.getSummary();
  return NextResponse.json(summary);
}
