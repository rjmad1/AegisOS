import { describe, it, expect, vi } from 'vitest';
import { conversaMultiAgentDebateEngine } from '@/platform/conversa/ConversaMultiAgentDebateEngine';
import { conversaSemanticPublisher } from '@/platform/conversa/ConversaSemanticPublisher';
import { HashingEngine, CanonicalSerializer } from '@/platform/conversa/conversa-hashing';
import { conversaLivingGraphEngine } from '@/platform/conversa/ConversaLivingGraphEngine';

describe('Conversa Forensic Absorption Unit Tests', () => {
  describe('ConversaMultiAgentDebateEngine', () => {
    it('should execute multi-agent debate and produce valid consensus signature', async () => {
      const participants = [
        { agentId: 'agent-1', role: 'SecurityAuditor', modelEndpoint: 'ollama/llama3' },
        { agentId: 'agent-2', role: 'SRE', modelEndpoint: 'ollama/mistral' },
        { agentId: 'agent-3', role: 'Architect', modelEndpoint: 'azure/gpt-4o' },
      ];

      const result = await conversaMultiAgentDebateEngine.executeDebate(
        'debate-101',
        'Zero-Trust Architecture',
        participants,
        { scope: 'ECP' }
      );

      expect(result.debateId).toBe('debate-101');
      expect(result.proposals).toHaveLength(3);
      expect(result.consensusScore).toBeGreaterThan(0.8);
      expect(result.cryptographicSignature).toBeDefined();
      expect(typeof result.cryptographicSignature).toBe('string');
    });
  });

  describe('3-Hash Lineage Engine & Semantic Publisher', () => {
    it('should generate deterministic canonical JSON serialization', () => {
      const obj1 = { b: 2, a: 1, timestamp: '2026-07-29T10:00:00Z' };
      const obj2 = { a: 1, b: 2, timestamp: '2026-07-29T12:00:00Z' };

      const canon1 = CanonicalSerializer.serialize(obj1, { excludeVolatileFields: true });
      const canon2 = CanonicalSerializer.serialize(obj2, { excludeVolatileFields: true });

      expect(canon1).toBe(canon2);
    });

    it('should compute valid semanticHash, contentHash, and provenanceHash', async () => {
      const minutes = await conversaSemanticPublisher.publish(
        'mtg-test-1',
        'Raw text transcript content...',
        [{ action: 'Deploy ECP guardrails', owner: 'Alice' }],
        [{ decision: 'Approve local-first SQLite migration' }],
        [{ risk: 'VRAM spike during 70B inference' }]
      );

      expect(minutes.lineage.semanticHash).toHaveLength(64);
      expect(minutes.lineage.contentHash).toHaveLength(64);
      expect(minutes.lineage.provenanceHash).toHaveLength(64);
      expect(minutes.metadata.signatureAlgorithm).toBe('SHA-256-3Hash-Lineage');
    });
  });

  describe('ConversaLivingGraphEngine Cycle Detection', () => {
    it('should throw error when adding self-referential or cycling dependency edge', async () => {
      await expect(
        conversaLivingGraphEngine.addEdge({
          sourceNodeId: 'node-A',
          targetNodeId: 'node-A',
          relationship: 'DependsOn',
        })
      ).rejects.toThrow('Self-referential edges are prohibited');
    });
  });
});
