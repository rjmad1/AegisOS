// ============================================================================
// Semantic Search Abstractions — Phase 8 (Architecture Only)
// ============================================================================

import { KnowledgeEntity, DocumentChunk } from "./knowledge";

export interface IEmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  getDimension(): number;
  getModelName(): string;
}

export interface IVectorStore {
  addChunks(chunks: DocumentChunk[], vectors: number[][]): Promise<void>;
  similaritySearch(vector: number[], k: number): Promise<DocumentChunk[]>;
  deleteChunks(docId: string): Promise<void>;
}

export interface ISimilaritySearch {
  search(queryVector: number[], limit: number): Promise<{ chunk: DocumentChunk; score: number }[]>;
}

export interface IHybridSearch {
  search(queryText: string, limit: number): Promise<{ entity: KnowledgeEntity; score: number }[]>;
}

export interface IRanking {
  rank(entities: KnowledgeEntity[], query: string): Promise<KnowledgeEntity[]>;
}

export interface IReranking {
  rerank(
    results: { entity: KnowledgeEntity; score: number }[],
    query: string
  ): Promise<{ entity: KnowledgeEntity; score: number }[]>;
}

export interface IQueryExpansion {
  expandQuery(originalQuery: string): Promise<string[]>;
}

export interface IContextBuilder {
  buildContext(
    results: { chunk: DocumentChunk; score: number }[],
    tokenLimit: number
  ): Promise<string>;
}
