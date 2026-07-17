// src/app/api/v1/skills/route.ts
// API Handlers for listing, registering, discovering, and composing AegisOS skills

import { NextRequest, NextResponse } from "next/server";
import { skillsService } from "@/services/skills.service";
import { handleCaching, formatErrorResponse } from "@/utils/api-helper";
import { ValidationError } from "@/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain") || "";
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    let skills = await skillsService.getSkills();

    if (domain) {
      skills = skills.filter(s => s.domain.toLowerCase() === domain.toLowerCase());
    }
    if (status) {
      skills = skills.filter(s => s.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      skills = skills.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.purpose.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q)
      );
    }

    return handleCaching(request, skills);
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      throw new ValidationError("Missing required field: action");
    }

    // 1. Discover matching skills based on intent
    if (action === "discover") {
      const { intent } = body;
      if (!intent) {
        throw new ValidationError("Missing 'intent' string for discovery.");
      }
      const results = await skillsService.discoverSkills(intent);
      return NextResponse.json(results);
    }

    // 2. Perform composition and check compatibility
    if (action === "compose") {
      const { skillIds } = body;
      if (!Array.isArray(skillIds) || skillIds.length === 0) {
        throw new ValidationError("Missing or invalid 'skillIds' array for composition.");
      }
      const result = await skillsService.composeSkills(skillIds);
      return NextResponse.json(result);
    }

    // 3. Retrieve system-wide analytics
    if (action === "analytics") {
      const analytics = await skillsService.getAnalytics();
      return NextResponse.json(analytics);
    }

    // 4. Register a new skill
    if (action === "register") {
      const { skill } = body;
      if (!skill || !skill.id || !skill.name || !skill.domain) {
        throw new ValidationError("Missing required fields inside 'skill' payload.");
      }
      
      const skillDef = {
        id: skill.id,
        name: skill.name,
        purpose: skill.purpose || "",
        domain: skill.domain,
        version: skill.version || "1.0.0",
        status: skill.status || "enabled",
        triggers: skill.triggers || [],
        prerequisites: skill.prerequisites || [],
        dependencies: skill.dependencies || [],
        supportedTools: skill.supportedTools || [],
        inputSchema: skill.inputSchema || { type: "object", properties: {} },
        outputSchema: skill.outputSchema || { type: "object", properties: {} },
        confidenceScore: skill.confidenceScore ?? 0.9,
        executionCost: skill.executionCost ?? 0.01,
        latencyMs: skill.latencyMs ?? 200,
        sandboxPolicy: skill.sandboxPolicy || {
          allowNetwork: false,
          allowedHosts: [],
          allowFileSystem: false,
          allowedPaths: []
        },
        permissions: skill.permissions || ["execute_tools"],
        metadata: skill.metadata || {}
      };

      await skillsService.registerSkill(skillDef);
      return NextResponse.json({ success: true, skill: skillDef }, { status: 201 });
    }

    throw new ValidationError(`Unsupported action: ${action}`);
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}
