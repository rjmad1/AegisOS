// src/platform/pik/kernel/__tests__/PlatformIntelligenceKernel.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { platformDiscoveryEngine } from '../evolution/PlatformDiscoveryEngine';
import { changeImpactAnalyzer } from '../impact-analysis/ChangeImpactAnalyzer';
import { platformPlanningEngine } from '../planning/PlatformPlanningEngine';
import { architecturalGovernanceEngine } from '../evolution/ArchitecturalGovernanceEngine';
import { architecturalMemorySystem } from '../memory/ArchitecturalMemorySystem';
import prisma from '../../../../infrastructure/db/prisma';

describe('Platform Intelligence Kernel (PIK) & Self-Engineering Platform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Phase 1 & 10: Platform Discovery Engine (PKIP) & Knowledge Graph', () => {
    it('should run discovery and ingest assets and relationships', async () => {
      const result = await platformDiscoveryEngine.discoverAll();
      expect(result.assets).toBeDefined();
      expect(result.assets.length).toBeGreaterThan(0);
      
      // Verify Code and Test assets are normalized
      const codeAsset = result.assets.find(a => a.type === 'code');
      expect(codeAsset).toBeDefined();
      expect(codeAsset?.id).toContain('code:');
      expect(codeAsset?.properties.path).toBeDefined();

      // Verify inferred relationships
      expect(result.relationships).toBeDefined();
    }, 60000);
  });

  describe('Phase 2 & 3: Architectural Reasoning & Change Impact Analysis (CPIP)', () => {
    it('should build an impact graph and calculate risk profiles', async () => {
      // Analyze a mock modification to PlatformKernel
      const analysis = await changeImpactAnalyzer.analyzeRequest({
        intent: 'Add dynamic scheduler to PlatformKernel',
        filePaths: ['src/platform/kernel/PlatformKernel.ts']
      });

      expect(analysis.entities).toBeDefined();
      expect(analysis.entities).toContain('code:src/platform/kernel/PlatformKernel.ts');
      expect(analysis.riskProfile).toBeDefined();
      expect(analysis.riskProfile.architectural).toBeGreaterThanOrEqual(50); // Kernel modification should be high risk
      expect(analysis.riskProfile.security).toBeDefined();
      expect(analysis.complexity).toBeGreaterThan(0);
      expect(analysis.estimatedEffortMinutes).toBeGreaterThan(0);
      expect(analysis.confidence).toBeDefined();
    });
  });

  describe('Phase 4 & 5: Planning Engine & Digital Twin Preview', () => {
    it('should decompose requests into plans and simulate overlay updates', async () => {
      const intent = 'Implement dynamic cache cleanup';
      const filePaths = ['src/platform/pik/OptimizationEngine.ts'];

      // 1. Create planning proposal
      const proposal = await platformPlanningEngine.createPlanningProposal(intent, filePaths);
      expect(proposal.id).toBeDefined();
      expect(proposal.status).toBe('PENDING');
      expect(proposal.executionPlan.tasks.length).toBeGreaterThan(0);
      expect(proposal.executionPlan.requiredTests).toBeDefined();

      // 2. Execute simulation overlay on Digital Twin
      const sim = await platformPlanningEngine.previewSimulation(proposal.id);
      expect(sim.success).toBe(true);
      expect(sim.trace).toContain('[CYCLE_DETECTOR]');
      expect(sim.sessionData).toBeDefined();
    });
  });

  describe('Phase 7 & 8: Architectural Governance & Technical Debt (AGTDP)', () => {
    it('should audit codebase and log technical debt and maturity indexes', async () => {
      const audit = await architecturalGovernanceEngine.runGovernanceAudit();
      expect(audit.afi).toBeGreaterThan(0);
      expect(audit.pmi).toBeGreaterThan(0);
      expect(audit.findings).toBeDefined();

      // Check if logged in database
      const dbMaturity = await prisma.maturityHistory.findFirst({
        where: { qualificationHistoryId: 'governance-audit' },
        orderBy: { timestamp: 'desc' }
      });
      expect(dbMaturity).not.toBeNull();
      expect(dbMaturity?.architecture).toBe(audit.afi);
    }, 60000);
  });

  describe('Phase 11: Architectural Memory System (AKMS)', () => {
    it('should ingest decision memory and persist Markdown and EKG edges', async () => {
      const memoryId = `test-mem-${Date.now()}`;
      const memoryData = {
        id: memoryId,
        title: 'Test Ingest Decision',
        category: 'decision' as const,
        status: 'Accepted' as const,
        decision: 'Use Vitest as primary testing framework.',
        context: 'We require fast parallel unit test execution.',
        tradeOffs: 'Vitest is highly compatible with ESModules but requires Node >= 18.',
        consequences: 'Improves platform verification speed.',
        relatedArtifacts: ['code:src/platform/pik/types.ts'],
        introducedVersion: '1.2.5',
        timestamp: new Date().toISOString()
      };

      await architecturalMemorySystem.ingestMemory(memoryData);

      // Verify memory is returned in memories list
      const memories = architecturalMemorySystem.getMemories();
      const ingested = memories.find(m => m.id === memoryId);
      expect(ingested).toBeDefined();
      expect(ingested?.title).toBe(memoryData.title);

      // Verify DB record is created
      const dbArtifact = await prisma.artifact.findUnique({
        where: { id: `memory:${memoryId}` }
      });
      expect(dbArtifact).not.toBeNull();
      expect(dbArtifact?.name).toBe(memoryData.title);
    });
  });
});
