// src/app/api/v1/skills/[id]/route.ts
// API Handlers for individual AegisOS skill details, execution, toggles, and telemetry metrics

import { NextRequest, NextResponse } from "next/server";
import { skillsService } from "@/services/skills.service";
import { formatErrorResponse } from "@/utils/api-helper";
import { ValidationError, NotFoundError } from "@/utils/errors";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const skill = await skillsService.getSkill(id);
    
    if (!skill) {
      throw new NotFoundError(`Skill with ID '${id}' not found.`);
    }

    const metrics = await skillsService.getSkillMetrics(id);
    return NextResponse.json({ skill, metrics });
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      throw new ValidationError("Missing required field: action");
    }

    const skill = await skillsService.getSkill(id);
    if (!skill) {
      throw new NotFoundError(`Skill with ID '${id}' not found.`);
    }

    // 1. Toggle Enablement
    if (action === "toggle") {
      const { enabled } = body;
      if (typeof enabled !== "boolean") {
        throw new ValidationError("Missing or invalid boolean field: enabled");
      }
      const success = await skillsService.toggleSkill(id, enabled);
      return NextResponse.json({ success });
    }

    // 2. Execute Skill (with triggers, inputs, tracing, retries, and sandbox checks)
    if (action === "execute") {
      const { input, parentId, workflowId } = body;
      if (!input) {
        throw new ValidationError("Missing required 'input' object parameters for execution.");
      }
      
      const record = await skillsService.executeSkill(id, input, { parentId, workflowId });
      return NextResponse.json(record);
    }

    // 3. Delete Skill
    if (action === "delete") {
      const success = await skillsService.deleteSkill(id);
      return NextResponse.json({ success });
    }

    throw new ValidationError(`Unsupported action: ${action}`);
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}
