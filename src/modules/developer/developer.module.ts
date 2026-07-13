// src/modules/developer/developer.module.ts

import { PlatformModule } from '@/platform/kernel/types';
import { Code, ShoppingBag, Terminal, Activity } from 'lucide-react';
import { multiLanguageSdkGenerator } from '@/platform/developer/sdk/MultiLanguageSdkGenerator';

export const developerModule: PlatformModule = {
  id: 'developer',
  name: 'Developer Platform',
  version: '1.0.0',
  domain: 'platform',
  description: 'Extensibility and customization portal for agents, workflows, and plugins marketplace',

  routes: [
    { path: '/developer-portal', moduleId: 'developer', label: 'Developer Portal' },
    { path: '/marketplace', moduleId: 'developer', label: 'Marketplace Store' }
  ],

  navItems: [
    {
      id: 'nav-developer-portal',
      label: 'Developer Portal',
      href: '/developer-portal',
      icon: Code,
      group: 'Developer Experience',
      order: 10
    },
    {
      id: 'nav-marketplace',
      label: 'Marketplace',
      href: '/marketplace',
      icon: ShoppingBag,
      group: 'Developer Experience',
      order: 11
    }
  ],

  commands: [
    {
      id: 'cmd.developer.portal',
      title: 'Open Developer Experience Portal',
      category: 'navigation',
      action: () => {
        window.location.href = '/developer-portal';
      }
    },
    {
      id: 'cmd.developer.marketplace',
      title: 'Open Extension Marketplace Store',
      category: 'navigation',
      action: () => {
        window.location.href = '/marketplace';
      }
    }
  ],

  searchProviders: [
    {
      id: 'developer.search.marketplace',
      name: 'Marketplace listing packages',
      category: 'developer',
      search: async (query: string) => {
        try {
          const res = await fetch(`/api/v1/developer/marketplace`);
          if (!res.ok) return [];
          const items = await res.json();
          const q = query.toLowerCase();
          return items
            .filter((it: any) => it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q))
            .map((it: any) => ({
              id: it.id,
              title: it.name,
              description: `[${it.type.toUpperCase()}] ${it.description} by ${it.author}`,
              href: '/marketplace',
              category: 'developer',
              score: 0.85
            }));
        } catch {
          return [];
        }
      }
    }
  ],

  lifecycle: {
    onInit: async () => {
      console.log('[DeveloperModule] Initializing Developer Platform module...');
      // Auto-generate multi-language stubs into public directory on startup
      try {
        multiLanguageSdkGenerator.generateAll();
      } catch (err) {
        console.error('[DeveloperModule] SdkGenerator failed during initialization:', err);
      }
    },
    onReady: async () => {
      console.log('[DeveloperModule] Developer Platform and Extension marketplace is online.');
    }
  }
};

export default developerModule;
