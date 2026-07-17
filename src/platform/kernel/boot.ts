// ============================================================================
// Platform Boot — Module discovery and kernel initialization
// ============================================================================
// Next.js client code cannot dynamically import arbitrary paths at runtime.
// Modules are statically imported here and passed to the kernel.
// To add a new module, import it and add it to the `allModules` array.
// ============================================================================

import { PlatformKernel } from './PlatformKernel';
import type { PlatformModule } from './types';

// --- Static module imports (added as modules are created) ---
import { platformModule } from '@/modules/platform/platform.module';
import { operationsModule } from '@/modules/operations/operations.module';
import { knowledgeModule } from '@/modules/knowledge/knowledge.module';
import { artifactsModule } from '@/modules/artifacts/artifacts.module';
import { administrationModule } from '@/modules/administration/administration.module';
import { settingsModule } from '@/modules/settings/settings.module';
import { aiRuntimeModule } from '@/modules/ai-runtime/ai-runtime.module';
import { infrastructureModule } from '@/modules/infrastructure/infrastructure.module';
import { workflowsModule } from '@/modules/workflows/workflows.module';
import { observabilityModule } from '@/modules/observability/observability.module';
import { reliabilityModule } from '@/modules/reliability/reliability.module';
import { developerModule } from '@/modules/developer/developer.module';
import { skillsModule } from '@/modules/skills/skills.module';
import { engineeringIntelligenceModule } from '@/modules/engineering-intelligence/engineering-intelligence.module';
import { missionControlModule } from '@/modules/mission-control/mission-control.module';

export const allModules: PlatformModule[] = [
  platformModule,
  operationsModule,
  knowledgeModule,
  artifactsModule,
  administrationModule,
  settingsModule,
  aiRuntimeModule,
  infrastructureModule,
  workflowsModule,
  observabilityModule,
  reliabilityModule,
  developerModule,
  skillsModule,
  engineeringIntelligenceModule,
  missionControlModule,
];

let booted = false;

export async function bootPlatform(): Promise<void> {
  if (booted) return;
  booted = true;
  await PlatformKernel.boot(allModules);
}

export { PlatformKernel };

