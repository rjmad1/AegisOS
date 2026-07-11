// ============================================================================
// Search Framework — Types
// ============================================================================

export type SearchCategory =
  | 'artifacts'
  | 'conversations'
  | 'jobs'
  | 'knowledge'
  | 'settings'
  | 'commands'
  | 'documentation'
  | 'navigation'
  | string;

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  href?: string;
  category: SearchCategory;
  score: number;
  highlights?: string[];
  icon?: React.ComponentType<{ className?: string }>;
  action?: () => void;
  metadata?: Record<string, unknown>;
}

export interface SearchResultGroup {
  category: SearchCategory;
  label: string;
  results: SearchResult[];
}

export interface SearchProvider {
  id: string;
  name: string;
  category: SearchCategory;
  search: (query: string) => Promise<SearchResult[]>;
}

export interface SearchQuery {
  text: string;
  categories?: SearchCategory[];
  limit?: number;
  timestamp: number;
}

import type React from 'react';
