// src/app/api/v1/mission/route.ts
// EMO API route for listing and creating Engineering Missions

import { NextRequest, NextResponse } from 'next/server';
import { missionOrchestrator } from '@/platform/mission/MissionOrchestrator';

export async function GET() {
  try {
    const list = await missionOrchestrator.listMissions();
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { objective, type, origin, constraints, priority, autoStart } = body;

    if (!objective) {
      return NextResponse.json({ error: 'Missing objective for engineering mission.' }, { status: 400 });
    }

    const mission = await missionOrchestrator.createMission({
      objective,
      type,
      origin,
      constraints,
      priority
    });

    if (autoStart) {
      // Trigger end-to-end orchestration asynchronously
      missionOrchestrator.orchestrateWorkflow(mission.id).catch(err => {
        console.error(`[EMO API] Asynchronous workflow orchestration failed for mission ${mission.id}:`, err.message);
      });
      mission.lifecycleState = 'DISCOVERED'; // Mark as starting
    }

    return NextResponse.json({
      message: autoStart ? 'Engineering mission created and orchestration started.' : 'Engineering mission created.',
      mission
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
