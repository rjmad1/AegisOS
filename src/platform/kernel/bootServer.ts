// ============================================================================
// Platform Server Boot — Server-side platform orchestration
// ============================================================================

import { PlatformKernel, allModules } from './boot';

let booted = false;

export async function bootPlatform(): Promise<void> {
  if (booted) return;
  booted = true;
  await PlatformKernel.boot(allModules);
  try {
    const { platformOperationsControlPlane } = await import('../control-plane/PlatformOperationsControlPlane');
    await platformOperationsControlPlane.initialize();
  } catch (err) {
    console.error('[Boot] Platform Operations Control Plane failed to initialize:', err);
  }
}
