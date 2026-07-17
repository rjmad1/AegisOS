// src/modules/skills/skills.module.ts
// Platform Module definition for the AegisOS Skill Framework

import { PlatformModule } from "@/platform/kernel/types";
import { Cpu } from "lucide-react";

export const skillsModule: PlatformModule = {
  id: "skills",
  name: "Skills & Capabilities",
  version: "1.0.0",
  domain: "platform",
  description: "Manage, discover, compose, and monitor modular AI execution skills across capability domains.",

  routes: [
    { path: "/skills", moduleId: "skills", label: "Skills Control Center" }
  ],

  navItems: [
    {
      id: "nav-skills",
      label: "Skills Center",
      href: "/skills",
      icon: Cpu,
      group: "Platform",
      order: 8
    }
  ],

  commands: [
    {
      id: "cmd.skills.open",
      title: "Open Skills Control Center",
      category: "platform",
      action: () => {
        window.location.href = "/skills";
      }
    },
    {
      id: "cmd.skills.discover",
      title: "Open Skill Discovery Engine",
      category: "platform",
      action: () => {
        window.location.href = "/skills?tab=discovery";
      }
    },
    {
      id: "cmd.skills.orchestrate",
      title: "Open Skill Orchestrator",
      category: "platform",
      action: () => {
        window.location.href = "/skills?tab=orchestration";
      }
    }
  ],

  searchProviders: [
    {
      id: "search-skills-registry",
      name: "Skills & Telemetry Search",
      category: "platform",
      search: async (query: string) => {
        const q = query.toLowerCase();
        const results: any[] = [];

        try {
          const res = await fetch(`/api/v1/skills?search=${encodeURIComponent(query)}`);
          if (res.ok) {
            const skills = await res.json();
            if (Array.isArray(skills)) {
              skills.forEach((s: any) => {
                if (
                  s.name.toLowerCase().includes(q) || 
                  s.purpose.toLowerCase().includes(q) ||
                  s.domain.toLowerCase().includes(q)
                ) {
                  results.push({
                    id: `skill-${s.id}`,
                    title: `Skill: ${s.name}`,
                    description: `Domain: ${s.domain} | Status: ${s.status.toUpperCase()} | Purpose: ${s.purpose}`,
                    href: `/skills?id=${s.id}`,
                    category: "platform",
                    score: 1.0
                  });
                }
              });
            }
          }
        } catch (e) {
          console.error("[SkillsSearch] Search provider query failed:", e);
        }

        return results;
      }
    }
  ],

  lifecycle: {
    onInit: async () => {
      // Initialize on startup - Seed default skills if needed
      try {
        await fetch("/api/v1/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "analytics" }) // Dummy call to trigger service init
        });
      } catch {}
    },
    onDestroy: async () => {
      // Handled server-side
    }
  }
};
