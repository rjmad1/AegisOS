import * as React from 'react';
import { SearchEngine } from '@/platform/search/SearchEngine';

export function useSearch() {
  const [loading, setLoading] = React.useState(false);

  const search = React.useCallback(async (query: string, categories?: string[], limit?: number) => {
    setLoading(true);
    try {
      return await SearchEngine.search(query, categories, limit);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    search,
    loading,
    getRecent: SearchEngine.getRecentSearches.bind(SearchEngine),
    clearRecent: SearchEngine.clearRecentSearches.bind(SearchEngine),
  };
}
