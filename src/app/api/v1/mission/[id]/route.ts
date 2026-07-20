// src/app/api/v1/mission/[id]/route.ts
// EMO API route for operating on a specific Engineering Mission

import { NextRequest, NextResponse } from 'next/server';
import { missionOrchestrator } from '@/platform/mission/MissionOrchestrator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mission = await missionOrchestrator.getMission(id);
    if (!mission) {
      return NextResponse.json({ error: `Mission ${id} not found` }, { status: 404 });
    }
    return NextResponse.json(mission);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, nextState, payload } = body;

    const mission = await missionOrchestrator.getMission(id);
    if (!mission) {
      return NextResponse.json({ error: `Mission ${id} not found` }, { status: 404 });
    }

    if (action === 'transition') {
      if (!nextState) {
        return NextResponse.json({ error: 'Missing nextState parameter for transition' }, { status: 400 });
      }
      const updated = await missionOrchestrator.executeTransition(id, nextState, payload);
      return NextResponse.json({ message: `Successfully transitioned to ${nextState}.`, mission: updated });
    }

    if (action === 'approve') {
      mission.approvalState = 'APPROVED';
      const updated = await missionOrchestrator.executeTransition(id, 'APPROVED', payload);
      return NextResponse.json({ message: 'Mission approved.', mission: updated });
    }

    if (action === 'execute') {
      // Trigger dynamic orchestration from current stage
      missionOrchestrator.orchestrateWorkflow(id).catch(err => {
        console.error(`[EMO API] Workflow orchestration failed for mission ${id}:`, err.message);
      });
      return NextResponse.json({ message: 'Orchestration workflow triggered.', mission });
    }

    return NextResponse.json({ error: `Invalid action. Supported: transition | approve | execute` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
