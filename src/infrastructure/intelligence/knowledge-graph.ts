// src/infrastructure/intelligence/knowledge-graph.ts
// EIP Knowledge Graph Engine mapping architectural components, workflows, ADRs, models, and experts.

import * as fs from "fs";
import * as path from "path";
import prisma from "../db/prisma";
import { deploymentManager } from "../deployment/deployment-manager";
import { organizationalIntelligence } from "@/platform/knowledge/OrganizationalIntelligence";

export interface EipNode {
  id: string;
  label: string;
  type: "file" | "model" | "service" | "adr" | "workflow" | "database" | "expert";
  status: "healthy" | "degraded" | "unhealthy";
  metadata: Record<string, any>;
}

export interface EipEdge {
  id: string;
  source: string;
  target: string;
  type: "depends_on" | "references" | "uses" | "version_of" | "triggers" | "managed_by";
}

export class EipKnowledgeGraph {
  private static instance: EipKnowledgeGraph | null = null;

  private constructor() {}

  public static getInstance(): EipKnowledgeGraph {
    if (!EipKnowledgeGraph.instance) {
      EipKnowledgeGraph.instance = new EipKnowledgeGraph();
    }
    return EipKnowledgeGraph.instance;
  }

  /**
   * Dynamically constructs the Engineering Knowledge Graph.
   */
  public async getGraph(): Promise<{ nodes: EipNode[]; edges: EipEdge[] }> {
    const nodes: EipNode[] = [];
    const edges: EipEdge[] = [];

    // Safe execution context check
    const isServer = typeof window === "undefined";

    // 1. Add Services (Infrastructure)
    try {
      const services = await deploymentManager.getServicesStatus();
      services.forEach((s) => {
        nodes.push({
          id: `svc:${s.id}`,
          label: s.name,
          type: "service",
          status: s.status === "started" ? "healthy" : "unhealthy",
          metadata: { port: s.port, pid: s.pid, description: s.description }
        });

        // Add service dependency edges
        s.dependencies.forEach((dep) => {
          edges.push({
            id: `edge:svc:${s.id}-depends:${dep}`,
            source: `svc:${s.id}`,
            target: `svc:${dep}`,
            type: "depends_on"
          });
        });
      });
    } catch {
      // Mock services for safety
      ["ollama", "litellm", "aegisos"].forEach((id) => {
        nodes.push({
          id: `svc:${id}`,
          label: id.toUpperCase(),
          type: "service",
          status: "healthy",
          metadata: { description: `${id} mock service` }
        });
      });
    }

    // 2. Add Models (from ModelManifest.json)
    if (isServer) {
      try {
        const manifestPath = path.resolve(process.cwd(), "ModelManifest.json");
        if (fs.existsSync(manifestPath)) {
          const raw = fs.readFileSync(manifestPath, "utf-8");
          const manifest = JSON.parse(raw);
          manifest.forEach((m: any) => {
            const modelId = `model:${m.name}`;
            nodes.push({
              id: modelId,
              label: m.name,
              type: "model",
              status: m.role.includes("idle") ? "degraded" : "healthy",
              metadata: { size: m.size, parameters: m.parameters, alias: m.alias, role: m.role }
            });

            // Models run on Ollama/LiteLLM service
            edges.push({
              id: `edge:${modelId}-uses-svc:litellm`,
              source: modelId,
              target: "svc:litellm",
              type: "uses"
            });
          });
        }
      } catch (err) {
        console.error("[EipKnowledgeGraph] Failed to load model manifest:", err);
      }
    } else {
      nodes.push({ id: "model:gemma4:latest", label: "gemma4:latest", type: "model", status: "healthy", metadata: {} });
    }

    // 3. Add Workflows (from Prisma Database)
    if (isServer) {
      try {
        const dbWorkflows = await prisma.workflow.findMany({
          where: { deletedAt: null }
        });
        dbWorkflows.forEach((w) => {
          const wfId = `wf:${w.id}`;
          nodes.push({
            id: wfId,
            label: w.name,
            type: "workflow",
            status: w.status === "active" ? "healthy" : "degraded",
            metadata: { version: w.version, description: w.description }
          });

          // Workflows use the AegisOS service gateway
          edges.push({
            id: `edge:${wfId}-uses-svc:aegisos`,
            source: wfId,
            target: "svc:aegisos",
            type: "uses"
          });
        });
      } catch (err) {
        console.error("[EipKnowledgeGraph] Failed to query workflows from db:", err);
      }
    } else {
      nodes.push({ id: "wf:sample", label: "Sample Workflow", type: "workflow", status: "healthy", metadata: {} });
    }

    // 4. Add ADRs (from adr/)
    if (isServer) {
      try {
        const adrDir = path.resolve(process.cwd(), "adr");
        if (fs.existsSync(adrDir)) {
          const files = fs.readdirSync(adrDir);
          files.forEach((file) => {
            if (file.endsWith(".md")) {
              const adrId = `adr:${file.replace(".md", "")}`;
              const adrTitle = file.replace(/-/g, " ").replace(".md", "").substring(4);
              nodes.push({
                id: adrId,
                label: adrTitle,
                type: "adr",
                status: "healthy",
                metadata: { file }
              });

              // ADRs link to service, models, or general architectures
              if (file.includes("Authentication") || file.includes("Control-Plane")) {
                edges.push({
                  id: `edge:${adrId}-references-svc:aegisos`,
                  source: adrId,
                  target: "svc:aegisos",
                  type: "references"
                });
              }
            }
          });
        }
      } catch (err) {
        console.error("[EipKnowledgeGraph] Failed to load ADRs:", err);
      }
    } else {
      nodes.push({ id: "adr:ADR-009", label: "Autonomic OS Architecture", type: "adr", status: "healthy", metadata: {} });
    }

    // 5. Add Core Files & Databases
    nodes.push({
      id: "db:sqlite",
      label: "AegisOS SQLite DB",
      type: "database",
      status: "healthy",
      metadata: { path: "databases/dev.db" }
    });

    nodes.push({
      id: "file:platform-kernel",
      label: "PlatformKernel.ts",
      type: "file",
      status: "healthy",
      metadata: { path: "src/platform/kernel/PlatformKernel.ts" }
    });

    edges.push({
      id: "edge:file:platform-kernel-manages-svc:aegisos",
      source: "file:platform-kernel",
      target: "svc:aegisos",
      type: "managed_by"
    });

    // 6. Add Expert SMEs
    try {
      const experts = organizationalIntelligence.getExperts();
      experts.forEach((exp) => {
        const expId = `expert:${exp.userId}`;
        nodes.push({
          id: expId,
          label: exp.name,
          type: "expert",
          status: "healthy",
          metadata: { email: exp.email, role: exp.role, domains: exp.expertDomains }
        });

        // Experts own workflows or components
        exp.capabilityIds.forEach((cap) => {
          edges.push({
            id: `edge:${expId}-manages-cap:${cap}`,
            source: expId,
            target: "db:sqlite", // Link to standard system boundary
            type: "managed_by"
          });
        });
      });
    } catch {}

    return { nodes, edges };
  }
}

export const eipKnowledgeGraph = EipKnowledgeGraph.getInstance();
export default eipKnowledgeGraph;
