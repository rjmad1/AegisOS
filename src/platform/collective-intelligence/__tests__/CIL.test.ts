import { describe, it, expect, beforeEach } from 'vitest';
import { 
  DeliberationService, 
  ChainOfThoughtStrategy 
} from '../DeliberationService';
import { CritiqueService } from '../CritiqueService';
import { ConsensusService } from '../ConsensusService';
import { ReflectionService } from '../ReflectionService';
import { SkillRecommendationService } from '../SkillRecommendationService';
import { LearningRepository, InMemoryLearningStorage } from '../LearningRepository';

describe('Collective Intelligence Layer (CIL) Core Boundaries', () => {
  
  describe('DeliberationService', () => {
    let deliberationService: DeliberationService;

    beforeEach(() => {
      deliberationService = new DeliberationService();
      deliberationService.registerStrategy(new ChainOfThoughtStrategy());
    });

    it('should deliberate using a registered strategy', async () => {
      const result = await deliberationService.deliberate('solve complex math', 'chain_of_thought');
      expect(result.type).toBe('deliberation_result');
      expect(result.confidence.confidenceScore).toBeGreaterThan(0.5);
      expect(result.reasoningTrace.length).toBeGreaterThan(0);
    });

    it('should throw an error for unregistered strategies', async () => {
      await expect(deliberationService.deliberate('test', 'tree_of_thought'))
        .rejects.toThrow(/not is not registered|is not registered/i);
    });
  });

  describe('CritiqueService', () => {
    let critiqueService: CritiqueService;

    beforeEach(() => {
      critiqueService = new CritiqueService();
    });

    it('should generate critique and identify logic flaws for empty plans', async () => {
      const result = await critiqueService.reviewPlan({ planId: 'p-1', planContent: null });
      expect(result.type).toBe('critique_result');
      expect(result.approved).toBe(false);
      expect(result.issuesFound.length).toBeGreaterThan(0);
      expect(result.issuesFound[0].severity).toBe('critical');
    });

    it('should approve valid plans', async () => {
      const result = await critiqueService.reviewPlan({ planId: 'p-2', planContent: { step1: 'do something' } });
      expect(result.approved).toBe(true);
      expect(result.issuesFound.length).toBe(0);
    });
  });

  describe('ConsensusService', () => {
    let consensusService: ConsensusService;

    beforeEach(() => {
      consensusService = new ConsensusService();
    });

    it('should select proposal with highest confidence in confidence_weighting', async () => {
      const proposals = [
        { proposerId: 'agent-1', proposalContent: 'A', confidenceScore: 0.6 },
        { proposerId: 'agent-2', proposalContent: 'B', confidenceScore: 0.9 },
      ];
      const result = await consensusService.reachConsensus(proposals, 'confidence_weighting');
      expect(result.winningProposalId).toBe('agent-2');
    });
  });

  describe('ReflectionService', () => {
    let reflectionService: ReflectionService;

    beforeEach(() => {
      reflectionService = new ReflectionService();
    });

    it('should reflect on success and generate positive lessons', async () => {
      const result = await reflectionService.reflect({
        workflowId: 'w-1',
        expectedOutcome: 'Done',
        actualOutcome: 'Done',
        executionLogs: [],
        success: true
      });
      expect(result.successfulStrategies.length).toBeGreaterThan(0);
      expect(result.mistakesIdentified.length).toBe(0);
    });
  });

  describe('SkillRecommendationService', () => {
    let recommendationService: SkillRecommendationService;

    beforeEach(() => {
      recommendationService = new SkillRecommendationService();
    });

    it('should recommend web search for lookup queries', async () => {
      const result = await recommendationService.recommend('Please search for the latest news on AI');
      expect(result.recommendedCapabilities).toContain('tool:web:search');
      expect(result.recommendedAgentRoles).toContain('researcher');
    });

    it('should not mutate anything, only return recommendations', async () => {
      const result = await recommendationService.recommend('Deploy the code to production');
      expect(result.humanApprovalRecommended).toBe(true);
      expect(result.recommendedCapabilities).not.toContain('tool:web:search');
    });
  });

  describe('LearningRepository', () => {
    let repository: LearningRepository;

    beforeEach(() => {
      repository = new LearningRepository(new InMemoryLearningStorage());
    });

    it('should enforce privacy boundaries by rejecting raw conversations', async () => {
      const badRecord = {
        id: 'rec-1',
        category: 'reflection' as const,
        success: false,
        content: { messages: [{ role: 'user', content: 'hello' }] },
        tags: [],
        createdAt: new Date().toISOString()
      };

      await expect(repository.store(badRecord)).rejects.toThrow(/Raw conversations are not permitted/i);
    });

    it('should store valid records', async () => {
      const record = {
        id: 'rec-2',
        category: 'strategy' as const,
        success: true,
        content: { strategyName: 'Test' },
        tags: ['test'],
        createdAt: new Date().toISOString()
      };

      await repository.store(record);
      const retrieved = await repository.search(['test']);
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].id).toBe('rec-2');
    });
  });
});
