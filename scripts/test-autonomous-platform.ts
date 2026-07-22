import { normalizeAndHashDom, InMemoryGraphStore } from '../packages/state-manager/src';
import { PlaywrightActionExecutor } from '../packages/browser-engine/src';
import { ValidationPipeline } from '../packages/validation-engine/src';
import { LocalDiskEvidenceCollector } from '../packages/evidence-pipeline/src';
import { PlannerAgent } from '../agents/planner/src';
import { ExplorerAgent } from '../agents/explorer/src';
import { ValidatorAgent } from '../agents/validator/src';
import { AutonomousTestingOrchestrator } from '../apps/orchestrator/src';
import { ExecutionWorkerNode } from '../apps/worker-node/src';

async function runAutonomousPlatformVerification() {
  console.log('--- Starting Autonomous Testing Platform Verification ---');

  // 1. Verify DOM Normalization and Hashing
  const rawDom1 = '<html><head><script>var x=1;</script></head><body><div id="dynamic-123">Hello World</div></body></html>';
  const rawDom2 = '<html><head><script>var x=999;</script></head><body><div id="dynamic-456">Hello World</div></body></html>';
  const norm1 = normalizeAndHashDom(rawDom1);
  const norm2 = normalizeAndHashDom(rawDom2);

  console.log(`[DOM Normalizer] DOM 1 Hash: ${norm1.domHash}`);
  console.log(`[DOM Normalizer] DOM 2 Hash: ${norm2.domHash}`);
  if (norm1.domHash === norm2.domHash) {
    console.log('✓ SUCCESS: Dynamic elements stripped, hashes match deterministically!');
  } else {
    console.error('✗ ERROR: Hashes did not match!');
    process.exit(1);
  }

  // 2. Verify State Graph Store
  const store = new InMemoryGraphStore();
  await store.addNode({
    nodeId: 'n1',
    url: 'http://localhost:3000',
    domHash: norm1.domHash,
    discoveredAt: new Date().toISOString(),
    interactables: [],
  });
  const hasN1 = await store.hasNode(norm1.domHash);
  console.log(`[State Store] Has Node Hash? ${hasN1}`);
  if (hasN1) {
    console.log('✓ SUCCESS: Node stored and retrieved from Graph Store!');
  } else {
    console.error('✗ ERROR: Node retrieval failed!');
    process.exit(1);
  }

  // 3. Verify Deterministic Validation Suite
  const validator = new ValidationPipeline();
  const report = await validator.runSuite({
    nodeId: 'n1',
    domSnapshot: '<html><body><img src="logo.png"></body></html>', // Missing alt
    consoleLogs: [{ type: 'error', text: 'Uncaught ReferenceError: foo is not defined' }],
  });
  console.log(`[Validation Suite] Violations Found: ${report.violations.length}`);
  if (report.violations.length === 2) {
    console.log('✓ SUCCESS: Deterministic validation caught accessibility and console errors!');
  } else {
    console.error(`✗ ERROR: Expected 2 violations, got ${report.violations.length}`);
    process.exit(1);
  }

  // 4. Verify Evidence Pipeline
  const collector = new LocalDiskEvidenceCollector();
  const artifact = await collector.processArtifact('sess-1', 'n1', 'CONSOLE', 'Console log data');
  console.log(`[Evidence Pipeline] Artifact Storage URI: ${artifact.storageUri}`);
  if (artifact.checksum) {
    console.log('✓ SUCCESS: Evidence artifact processed and checksummed!');
  }

  // 5. Verify AI Planner Agent
  const planner = new PlannerAgent();
  const goals = await planner.execute({ targetUrl: 'http://localhost:3000' }, { sessionId: 'sess-1', correlationId: 'corr-1' });
  console.log(`[Planner Agent] Generated ${goals.length} high-level workflow goals.`);
  if (goals.length > 0) {
    console.log(`✓ SUCCESS: Planner goal: "${goals[0].description}"`);
  }

  // 6. Verify Autonomous Orchestrator End-to-End Execution
  const orchestrator = new AutonomousTestingOrchestrator();
  const sessionResult = await orchestrator.runExploratorySession({
    sessionId: 'session-verification-1',
    targetUrl: 'http://localhost:3000',
    maxExplorationSteps: 5,
  });

  console.log(`[Orchestrator] Session Completed.`);
  console.log(`  - Session ID: ${sessionResult.sessionId}`);
  console.log(`  - Goals Processed: ${sessionResult.goalsCompleted}`);
  console.log(`  - Discovered Nodes: ${sessionResult.discoveredNodesCount}`);

  if (sessionResult.discoveredNodesCount >= 4) {
    console.log('✓ SUCCESS: Full Orchestration cycle completed successfully!');
  } else {
    console.error('✗ ERROR: Discovered node count mismatch.');
    process.exit(1);
  }

  console.log('\n==================================================');
  console.log('  ALL AUTONOMOUS PLATFORM VERIFICATIONS PASSED!  ');
  console.log('==================================================\n');
}

runAutonomousPlatformVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
