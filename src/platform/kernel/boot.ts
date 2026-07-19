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
import { governanceModule } from '@/modules/governance/governance.module';
import { settingsModule } from '@/modules/settings/settings.module';
import { platformIntelligenceModule } from '@/modules/platform-intelligence/platform-intelligence.module';
import { workflowsModule } from '@/modules/workflows/workflows.module';
import { observabilityModule } from '@/modules/observability/observability.module';
import { developerModule } from '@/modules/developer/developer.module';
import { capabilitiesModule } from '@/modules/capabilities/capabilities.module';
import { projectsModule } from '@/modules/projects/projects.module';

// New Architecture Modules
import { mcpEcosystemModule } from '@/modules/mcp-ecosystem/mcp-ecosystem.module';
import { benchmarkingModule } from '@/modules/benchmarking/benchmarking.module';
import { certificationModule } from '@/modules/certification/certification.module';
import { qualificationModule } from '@/modules/qualification/qualification.module';
import { architectureExplorerModule } from '@/modules/architecture-explorer/architecture-explorer.module';

export const allModules: PlatformModule[] = [
  platformModule,
  operationsModule,
  knowledgeModule,
  governanceModule,
  settingsModule,
  platformIntelligenceModule,
  workflowsModule,
  observabilityModule,
  developerModule,
  capabilitiesModule,
  projectsModule,
  
  // New Architecture Modules
  mcpEcosystemModule,
  benchmarkingModule,
  certificationModule,
  qualificationModule,
  architectureExplorerModule,
];

export { PlatformKernel };
