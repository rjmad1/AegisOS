// ============================================================================
// Operations API — GET /api/v1/synchronization (Background Sync Info)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { syncScheduler } from '@/infrastructure/scheduling/sync-scheduler';

export async function GET(request: NextRequest) {
  try {
    const syncStatus = syncScheduler.getStatus();
    
    return NextResponse.json({
      status: syncStatus.isRunning ? 'active' : 'idle',
      lastSyncTime: syncStatus.lastSyncTime > 0 ? new Date(syncStatus.lastSyncTime).toISOString() : null,
      checkpointFile: syncStatus.checkpointPath,
      dirtyCheckIntervalMs: 3000,
      conflictDetection: 'server-wins-optimistic',
      versionTracking: {
        engine: 'incremental-sha256',
        schema: 'v1',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
