// ============================================================================
// Knowledge Module — Frontend Subsystem Definition
// ============================================================================

import { PlatformModule } from "@/platform/kernel/types";
import { BookOpen } from "lucide-react";

export const knowledgeModule: PlatformModule = {
  id: "knowledge",
  name: "Knowledge Fabric",
  version: "1.0.0",
  domain: "knowledge",
  description: "Enterprise Knowledge Fabric, mapping objects, lineage, and semantic relationship topologies.",

  routes: [
    { path: "/knowledge", moduleId: "knowledge", label: "Knowledge Fabric Explorer" }
  ],

  navItems: [
    {
      id: "nav-knowledge",
      label: "Knowledge Fabric",
      href: "/knowledge",
      icon: BookOpen,
      group: "Operations",
      order: 7
    }
  ],

  commands: [
    {
      id: "cmd.knowledge.goto",
      title: "Open Knowledge Fabric",
      category: "navigation",
      action: () => {
        window.location.href = "/knowledge?tab=explorer";
      }
    },
    {
      id: "cmd.knowledge.graph",
      title: "Open Knowledge Graph",
      category: "navigation",
      action: () => {
        window.location.href = "/knowledge?tab=graph";
      }
    },
    {
      id: "cmd.knowledge.lineage",
      title: "Open Artifact Lineage Tracer",
      category: "navigation",
      action: () => {
        window.location.href = "/knowledge?tab=lineage";
      }
    },
    {
      id: "cmd.knowledge.timeline",
      title: "Open Knowledge Event Timeline",
      category: "navigation",
      action: () => {
        window.location.href = "/knowledge?tab=timeline";
      }
    },
    {
      id: "cmd.knowledge.collections",
      title: "Open Virtual Collections",
      category: "navigation",
      action: () => {
        window.location.href = "/knowledge?tab=collections";
      }
    }
  ],

  searchProviders: [
    {
      id: "search-knowledge-fabric",
      name: "Knowledge Fabric Search",
      category: "knowledge",
      search: async (query: string) => {
        if (!query || query.length < 2) return [];
        try {
          const res = await fetch(`/api/v1/knowledge/search?search=${encodeURIComponent(query)}`);
          if (!res.ok) return [];
          const list = await res.json();

          return list.map((ent: any) => ({
            id: ent.id,
            title: `[${ent.type.toUpperCase()}] ${ent.name}`,
            description: `${ent.description} | Score: ${(ent.score?.totalScore || 0.85).toFixed(2)}`,
            href: `/knowledge?tab=explorer&focus=${ent.id}`,
            category: "knowledge",
            score: ent.score?.totalScore || 0.85
          }));
        } catch (e) {
          console.error("[KnowledgeSearchProvider] Query failed:", e);
          return [];
        }
      }
    }
  ]
};
