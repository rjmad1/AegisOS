// ============================================================================
// Search Engine — Aggregates results from registered providers
// ============================================================================

import type { SearchProvider, SearchResult, SearchResultGroup } from './types';
import { EventBus } from '../event-bus/EventBus';

const RECENT_SEARCHES_KEY = 'platform:recent-searches';
const MAX_RECENT = 20;

class SearchEngineImpl {
  private providers: Map<string, SearchProvider> = new Map();

  // ---- Provider Registration ----

  registerProvider(provider: SearchProvider): void {
    this.providers.set(provider.id, provider);
  }

  unregisterProvider(id: string): void {
    this.providers.delete(id);
  }

  getProviders(): SearchProvider[] {
    return Array.from(this.providers.values());
  }

  // ---- Search ----

  async search(query: string, categories?: string[], limit = 50): Promise<SearchResultGroup[]> {
    if (!query.trim()) return [];

    EventBus.publish('search:query', { query, timestamp: Date.now() });

    const providers = categories
      ? Array.from(this.providers.values()).filter((p) => categories.includes(p.category))
      : Array.from(this.providers.values());

    // Fan-out search to all providers in parallel
    const resultArrays = await Promise.allSettled(
      providers.map(async (p) => {
        const results = await p.search(query);
        return { category: p.category, name: p.name, results };
      }),
    );

    // Group results by category
    const grouped: Map<string, SearchResult[]> = new Map();
    for (const r of resultArrays) {
      if (r.status === 'fulfilled') {
        const { category, results } = r.value;
        const existing = grouped.get(category) || [];
        grouped.set(category, [...existing, ...results]);
      }
    }

    // Sort within groups by score, apply limit
    const groups: SearchResultGroup[] = [];
    for (const [category, results] of grouped.entries()) {
      const sorted = results.sort((a, b) => b.score - a.score).slice(0, limit);
      groups.push({ category, label: categoryLabel(category), results: sorted });
    }

    // Save to recent searches
    this.addRecentSearch(query);

    const totalCount = groups.reduce((sum, g) => sum + g.results.length, 0);
    EventBus.publish('search:results', { query, count: totalCount });

    return groups;
  }

  // ---- Recent Searches ----

  getRecentSearches(): string[] {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private addRecentSearch(query: string): void {
    try {
      const recent = this.getRecentSearches().filter((q) => q !== query);
      recent.unshift(query);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
    } catch {
      // localStorage unavailable
    }
  }

  clearRecentSearches(): void {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // noop
    }
  }
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    artifacts: 'Artifacts',
    conversations: 'Conversations',
    jobs: 'Jobs',
    knowledge: 'Knowledge',
    settings: 'Settings',
    commands: 'Commands',
    documentation: 'Documentation',
    navigation: 'Navigation',
  };
  return labels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

export const SearchEngine = new SearchEngineImpl();
