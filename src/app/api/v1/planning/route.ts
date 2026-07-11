import { NextRequest, NextResponse } from "next/server";
import { specKitService } from "@/infrastructure/planning/spec-kit-service";

export async function GET() {
  return NextResponse.json({
    service: "Spec Kit",
    status: "active",
    role: "On-demand planning service",
    capabilities: [
      { name: "prd", description: "Product Requirement Document generator" },
      { name: "adr", description: "Architecture Decision Record formatter" },
      { name: "criteria", description: "Acceptance criteria generator" },
      { name: "implementation", description: "Step-by-step implementation plans" },
      { name: "traceability", description: "Requirement-to-test traceability matrix" }
    ],
    checks: ["H1 hierarchy check", "Consequences section presence check", "Scope limits check"]
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type, inputs, content } = body;

    if (action === "generate") {
      if (!type || !["prd", "adr", "criteria", "implementation", "traceability"].includes(type)) {
        return NextResponse.json(
          { error: "Invalid generate target type" },
          { status: 400 }
        );
      }
      const doc = specKitService.generateTemplate(type, inputs || {});
      return NextResponse.json({
        type,
        document: doc
      });
    }

    if (action === "audit" || action === "check") {
      if (!content) {
        return NextResponse.json({ error: "Missing content for audit check" }, { status: 400 });
      }
      const analysis = specKitService.auditSpecification(content);
      return NextResponse.json(analysis);
    }

    return NextResponse.json(
      { error: "Invalid action. Supported: generate | audit" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
