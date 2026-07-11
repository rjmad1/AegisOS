import { useNavigationStore } from '@/platform/navigation/NavigationService';

export function useNavigation() {
  const store = useNavigationStore();
  return {
    favorites: store.favorites,
    recent: store.recent,
    addFavorite: store.addFavorite,
    removeFavorite: store.removeFavorite,
    addRecent: store.addRecent,
    clearRecent: store.clearRecent,
    getBreadcrumbs: store.getBreadcrumbs,
    getNavigationGroups: store.getNavigationGroups,
  };
}
