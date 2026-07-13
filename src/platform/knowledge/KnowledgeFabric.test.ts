// ============================================================================
// EKOS Platform Unit Tests — Phase 9
// ============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { knowledgeGraphEngine } from "./KnowledgeGraphEngine";
import { semanticMemoryPlatform } from "./SemanticMemory";
import { ragPlatform } from "./RAGPlatform";
import { knowledgeGovernance } from "./KnowledgeGovernance";
import { knowledgeAnalytics } from "./KnowledgeAnalytics";
import { knowledgeFabricEngine } from "./KnowledgeFabric";
import { PropertyNode, AdvancedRelationship } from "@/types/knowledge-fabric";

describe("EKOS Knowledge Platform Suite", () => {
  beforeEach(async () => {
    // Force initialize to load bootstrapped data
    await knowledgeFabricEngine.initialize();
  });

  describe("Ontology & Graph Engine", () => {
    it("should allow valid relationships according to the ontology schema", () => {
      const result = knowledgeGraphEngine.validateRelationship("artifact", "conversation", "generated_by");
      expect(result.isValid).toBe(true);
    });

    it("should block invalid relationships according to the ontology schema", () => {
      const result = knowledgeGraphEngine.validateRelationship("tool", "artifact", "generated_by");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Ontology Violation");
    });

    it("should retrieve ingested nodes and filter sub-graphs", () => {
      const allNodes = knowledgeGraphEngine.getNodes();
      expect(allNodes.length).toBeGreaterThan(0);

      const workflowGraph = knowledgeGraphEngine.getSubGraph("workflow");
      expect(workflowGraph.nodes).toBeDefined();
    });
  });

  describe("Semantic Memory", () => {
    it("should fetch semantic memory cells and establish link associations", () => {
      const cells = semanticMemoryPlatform.getMemoryCells();
      expect(cells.length).toBeGreaterThan(0);

      const cell1 = cells[0];
      const cell2 = cells[1];

      const linked = semanticMemoryPlatform.linkMemories(cell1.id, cell2.id);
      expect(linked).toBe(true);

      const updatedCell1 = semanticMemoryPlatform.getMemoryCell(cell1.id);
      expect(updatedCell1?.linkedMemoryIds).toContain(cell2.id);
    });
  });

  describe("RAG Platform", () => {
    it("should match relevant content in hybrid search and provide grounding verification", async () => {
      const searchResult = await ragPlatform.retrieveAndGenerate("incident response escalations");
      
      expect(searchResult.answer).toBeDefined();
      expect(searchResult.confidence).toBeGreaterThan(0.5);
      expect(searchResult.grounding.isGrounded).toBe(true);
      expect(searchResult.results.length).toBeGreaterThan(0);
    });
  });

  describe("Governance, Quality, and Analytics", () => {
    it("should perform quality auditing checks and calculate trust scores", () => {
      const nodes = knowledgeGraphEngine.getNodes();
      const targetNode = nodes[0];

      const record = knowledgeGovernance.runQualityCheck(targetNode.id);
      expect(record.qualityScore).toBeGreaterThan(0.5);

      const trust = knowledgeGovernance.computeTrustScore(targetNode.id);
      expect(trust).toBeGreaterThan(0.5);
    });

    it("should compile the readiness report and list tech debt items", () => {
      const report = knowledgeAnalytics.compileReadinessReport();
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);

      const debt = knowledgeAnalytics.getTechnicalDebtRegister();
      expect(debt).toBeDefined();
    });
  });
});
