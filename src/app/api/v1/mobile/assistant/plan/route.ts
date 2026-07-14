import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../commands/route";
import { intentClassifier } from "@/platform/assistant/IntentClassifier";
import { taskPlanner } from "@/platform/assistant/TaskPlanner";
import { safetyValidator } from "@/platform/assistant/SafetyValidator";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid session credentials" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "BAD_REQUEST", message: "content field is required" }, { status: 400 });
    }

    const promptSafety = safetyValidator.validatePrompt(content);
    if (!promptSafety.safe) {
      return NextResponse.json({ error: "SAFETY_VIOLATION", message: promptSafety.reason }, { status: 400 });
    }

    const classification = intentClassifier.classify(content);
    const plan = taskPlanner.generatePlan(classification.intent, classification.entities);

    const planSafety = safetyValidator.validatePlan(plan);
    if (!planSafety.valid) {
      return NextResponse.json({ error: "VALIDATION_FAILED", message: planSafety.reason }, { status: 400 });
    }

    return NextResponse.json({ plan });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
