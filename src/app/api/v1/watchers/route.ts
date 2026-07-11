// ============================================================================
// Operations API — GET /api/v1/watchers (Active Filesystem Watchers)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { filesystemWatcherService } from '@/infrastructure/watcher/watcher-service';

export async function GET(request: NextRequest) {
  try {
    const activeWatchers = filesystemWatcherService.getActiveWatchers();

    const watchers = activeWatchers.map((pathStr) => ({
      path: pathStr,
      status: 'active',
      recursive: true,
      provider: 'NodeFsWatcher',
      target: 'artifacts-storage-plane',
      eventsMonitored: ['create', 'update', 'delete', 'rename', 'move'],
    }));

    return NextResponse.json({ watchers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
