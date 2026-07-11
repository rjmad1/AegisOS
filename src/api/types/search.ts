export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: "artifact" | "file" | "job" | "service" | "mcp_server";
  score: number; // Relevance score
  uri: string;   // Reference location
  highlights: Array<{
    field: string;
    snippet: string;
  }>;
  metadata: Record<string, any>;
}

export interface ISearchIndex {
  name: string;
  documentCount: number;
  lastIndexedAt?: string;
  add(documentId: string, fields: Record<string, any>): Promise<void>;
  remove(documentId: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ISearchProvider {
  id: string;
  name: string;
  supportedTypes: Array<SearchResult["type"]>;
  search(
    query: string,
    options?: { limit?: number; offset?: number; filters?: Record<string, any> }
  ): Promise<SearchResult[]>;
  indexDocument(documentId: string, content: Record<string, any>): Promise<void>;
  removeDocument(documentId: string): Promise<void>;
}

export interface IGlobalSearchService {
  registerProvider(provider: ISearchProvider): void;
  unregisterProvider(providerId: string): void;
  search(
    query: string,
    options?: { limit?: number; offset?: number; type?: Array<SearchResult["type"]> }
  ): Promise<SearchResult[]>;
  reindexAll(): Promise<void>;
}
