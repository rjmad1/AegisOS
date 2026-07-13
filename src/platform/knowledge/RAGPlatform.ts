// ============================================================================
// EKOS Enterprise RAG Platform — Phase 9
// ============================================================================

import {
  RAGSearchParams,
  RAGQueryResponse,
  RAGSearchResult,
  RAGCitation,
  GroundingVerification
} from "@/types/knowledge-fabric";
import { KnowledgeEntity, DocumentChunk } from "@/types/knowledge";
import { knowledgeGraphEngine } from "./KnowledgeGraphEngine";

export class RAGPlatform {
  private static instance: RAGPlatform | null = null;
  private documentChunks: DocumentChunk[] = [];

  private constructor() {
    this.bootstrapDocumentChunks();
  }

  public static getInstance(): RAGPlatform {
    if (!RAGPlatform.instance) {
      RAGPlatform.instance = new RAGPlatform();
    }
    return RAGPlatform.instance;
  }

  private bootstrapDocumentChunks() {
    this.documentChunks = [
      {
        id: "chunk-01",
        docId: "doc-operations-playbook",
        text: "The operational playbook dictates that incident response follows a 3-tier escalation structure: Tier 1 (Helpdesk triage), Tier 2 (Infrastructure team remediation), and Tier 3 (Principal AI Architect analysis). Response time service level agreement (SLA) is 15 minutes for critical hazards.",
        index: 0,
        metadata: { page: 1, author: "steward-admin@enterprise.org" }
      },
      {
        id: "chunk-02",
        docId: "doc-operations-playbook",
        text: "Log tampering detection triggers automated isolation procedures. If any unauthorized audit logs are modified, the system locks out the compromised subnet and issues a cryptographic notification on the event bus.",
        index: 1,
        metadata: { page: 2, author: "steward-admin@enterprise.org" }
      },
      {
        id: "chunk-03",
        docId: "doc-architecture-guidelines",
        text: "OpenClaw Platform uses Next.js app routing with React Server Components. Node authentication utilizes JSON Web Tokens (JWT) signed with RS256 keys. Secrets are stored inside memory utilizing IV salt encryption.",
        index: 0,
        metadata: { page: 1, author: "arch-leads@enterprise.org" }
      }
    ];
  }

  // --- Mock Vector Embedding Generator ---
  private getMockEmbedding(text: string): number[] {
    // Generate deterministic mock embedding based on string contents
    const size = 384;
    const vec = new Array(size).fill(0);
    const words = text.toLowerCase().split(/\W+/);
    for (let i = 0; i < size; i++) {
      let sum = 0;
      words.forEach((w, wIdx) => {
        if (w.length > 0) {
          sum += w.charCodeAt(0) * Math.sin(i + wIdx);
        }
      });
      vec[i] = sum % 100 / 100;
    }
    // Normalize vector
    const mag = Math.sqrt(vec.reduce((s, val) => s + val * val, 0));
    return vec.map(v => mag > 0 ? v / mag : 0);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return magB > 0 && magA > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
  }

  // --- Hybrid Search Execution ---
  public async search(params: RAGSearchParams): Promise<RAGSearchResult[]> {
    const query = params.query.toLowerCase();
    const limit = params.limit ?? 5;
    const type = params.searchType;

    const allNodes = knowledgeGraphEngine.getNodes();
    const allEdges = knowledgeGraphEngine.getRelationships();

    const searchResults: RAGSearchResult[] = [];

    // 1. Keyword Score matching
    const keywordScores: Record<string, number> = {};
    const queryWords = query.split(/\W+/).filter(w => w.length > 1);

    // 2. Vector Cosine Similarity Score matching
    const queryVector = this.getMockEmbedding(query);

    for (const node of allNodes) {
      let score = 0;

      // Type-specific search pathways
      if (type === "keyword" || type === "hybrid") {
        let textToMatch = `${node.label} ${node.type} ${node.owner} ${JSON.stringify(node.properties)}`.toLowerCase();
        let matches = 0;
        queryWords.forEach(w => {
          if (textToMatch.includes(w)) matches++;
        });
        const keywordScore = queryWords.length > 0 ? matches / queryWords.length : 0;
        score += keywordScore * 0.4;
      }

      if (type === "vector" || type === "hybrid") {
        const nodeText = `${node.label}: ${node.properties?.description || node.properties?.content || ""}`;
        const nodeVector = this.getMockEmbedding(nodeText);
        const vectorScore = this.cosineSimilarity(queryVector, nodeVector);
        score += vectorScore * 0.6;
      }

      if (type === "metadata") {
        // Match against properties keys/values
        let metaMatches = 0;
        for (const [k, v] of Object.entries(node.properties)) {
          if (k.toLowerCase().includes(query) || String(v).toLowerCase().includes(query)) {
            metaMatches++;
          }
        }
        score += metaMatches > 0 ? 0.8 : 0;
      }

      if (type === "temporal") {
        // Prioritize recently modified nodes
        const ageInDays = (Date.now() - new Date(node.properties?.createdAt || node.properties?.modifiedAt || Date.now()).getTime()) / 86400000;
        const recency = Math.max(0, 1 - ageInDays / 30); // 30-day window
        score += recency * 0.7;
      }

      if (type === "graph" || (type as string) === "relationship") {
        // Prioritize nodes with high graph centrality
        const edgesCount = allEdges.filter(e => e.sourceId === node.id || e.targetId === node.id).length;
        score += Math.min(1, edgesCount / 10) * 0.5;
      }

      if (score > 0.1) {
        // Build mock citations from chunk connections if available
        const citations: RAGCitation[] = [];
        const matchingChunks = this.documentChunks.filter(c => 
          c.docId === node.id || c.text.toLowerCase().includes(node.label.toLowerCase())
        );

        matchingChunks.forEach(chunk => {
          citations.push({
            sourceId: chunk.id,
            sourceName: chunk.docId,
            sourceUri: `file:///docs/${chunk.docId}.md`,
            exactMatchText: chunk.text.slice(0, 80) + "...",
            confidence: 0.95
          });
        });

        searchResults.push({
          entity: {
            id: node.id,
            type: node.type as any,
            name: node.label,
            description: node.properties?.description || node.properties?.content || "",
            tags: node.properties?.tags || [],
            metadata: node.properties,
            createdAt: node.properties?.createdAt || new Date().toISOString(),
            modifiedAt: node.properties?.modifiedAt || new Date().toISOString()
          },
          score: Math.min(1.0, score),
          citations,
          trustScore: node.trustScore,
          freshnessScore: node.properties?.freshnessScore ?? 0.9
        });
      }
    }

    // Sort by Reciprocal Rank Fusion / Combined scores
    return searchResults.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // --- Grounding & Verification Execution ---
  public verifyGrounding(answer: string, retrievedTexts: string[]): GroundingVerification {
    const unverifiedClaims: string[] = [];
    let groundedScore = 1.0;

    // Detect claims in the answer (e.g. specific keywords, stats)
    // and verify if they exist in retrieved text
    const sentences = answer.match(/[^.!?]+[.!?]+/g) || [answer];
    
    sentences.forEach(sentence => {
      const cleanSentence = sentence.trim();
      if (cleanSentence.length < 10) return;

      // Skip introductory conversational boilerplate
      if (
        cleanSentence.toLowerCase().startsWith("based on") ||
        cleanSentence.toLowerCase().startsWith("here is the verified") ||
        cleanSentence.toLowerCase().startsWith("no matching verified")
      ) {
        return;
      }

      let found = false;
      for (const chunkText of retrievedTexts) {
        // Look for common keywords similarity
        const sentenceWords = cleanSentence.toLowerCase().split(/\W+/).filter(w => w.length > 4);
        let matches = 0;
        sentenceWords.forEach(w => {
          if (chunkText.toLowerCase().includes(w)) matches++;
        });

        if (sentenceWords.length > 0 && matches / sentenceWords.length > 0.4) {
          found = true;
          break;
        }
      }

      if (!found) {
        unverifiedClaims.push(cleanSentence);
        groundedScore -= 0.25;
      }
    });

    return {
      isGrounded: unverifiedClaims.length === 0,
      score: Math.max(0, groundedScore),
      reasoning: unverifiedClaims.length === 0 
        ? "All claims in the generated response match verifiable source documents." 
        : `Identified ${unverifiedClaims.length} statements that lack grounding references in the retrieved corpus.`,
      unverifiedClaims
    };
  }

  // --- Combined Query Platform API ---
  public async retrieveAndGenerate(query: string, searchType: RAGSearchParams["searchType"] = "hybrid"): Promise<RAGQueryResponse> {
    const startTime = Date.now();

    // 1. Search Knowledge Graph and Documents
    const results = await this.search({ query, searchType, limit: 3 });
    const retrievedChunks = results.map(r => r.entity.description);

    // 2. Draft Response (simulating LLM answer grounded in chunks)
    let answer = `Based on your request "${query}", here is the verified knowledge:\n`;
    if (results.length > 0) {
      const topEntity = results[0].entity;
      answer += `[Verified] ${topEntity.name}: ${topEntity.description}.\n`;
      if (results[1]) {
        answer += `Additionally, this connects to ${results[1].entity.name} (${results[1].entity.description}).`;
      }
    } else {
      answer += "No matching verified records found in the enterprise knowledge graph.";
    }

    // 3. Grounding Verification
    const grounding = this.verifyGrounding(answer, retrievedChunks);

    // 4. Answer Confidence computation
    const avgSearchScore = results.length > 0 ? results.reduce((s, r) => s + r.score, 0) / results.length : 0.0;
    const avgTrustScore = results.length > 0 ? results.reduce((s, r) => s + r.trustScore, 0) / results.length : 0.0;
    const confidence = Math.min(1.0, (avgSearchScore * 0.4 + avgTrustScore * 0.4 + grounding.score * 0.2));

    return {
      answer,
      confidence: parseFloat(confidence.toFixed(2)),
      results,
      grounding,
      latencyMs: Date.now() - startTime
    };
  }
}

export const ragPlatform = RAGPlatform.getInstance();
export default ragPlatform;
