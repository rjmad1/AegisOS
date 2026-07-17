// src/app/api/v1/control-plane/discovery/route.ts
import { NextResponse } from 'next/server';
import { platformDigitalTwin } from '@/platform/control-plane/PlatformDigitalTwin';
import { multiNodeCoordinator } from '@/platform/control-plane/MultiNodeCoordinator';
import { platformOperationsControlPlane } from '@/platform/control-plane/PlatformOperationsControlPlane';
import { platformRBAC } from '@/platform/control-plane/PlatformRBAC';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Ensure control plane is initialized
    await platformOperationsControlPlane.initialize();

    const user = platformRBAC.getActiveContext();
    if (!platformRBAC.verify(user, 'obs:read')) {
      return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
    }

    const components = platformDigitalTwin.getAllComponents();
    const graph = platformDigitalTwin.getTopology();
    const clusterNodes = multiNodeCoordinator.getClusterNodes();

    return NextResponse.json({
      components,
      graph,
      clusterNodes,
      timestamp: Date.now()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
