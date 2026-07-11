import { NextRequest, NextResponse } from "next/server";
import { artifactRegistry } from "@/infrastructure/registry/artifact-registry";
import { jobQueue } from "@/infrastructure/jobs/job-queue";
import { deploymentManager } from "@/infrastructure/deployment/deployment-manager";
import { SearchResult } from "@/api/types/search";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || searchParams.get("query") || "";
    const typeFilter = searchParams.get("type")?.split(",") || [];
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    const queryLower = q.toLowerCase();
    const results: SearchResult[] = [];

    // Helper to compute match score
    const getScore = (title: string, desc: string): number => {
      let score = 0;
      if (title.toLowerCase() === queryLower) score += 100;
      else if (title.toLowerCase().includes(queryLower)) score += 50;
      if (desc.toLowerCase().includes(queryLower)) score += 20;
      return score;
    };

    // 1. Search Artifacts
    if (typeFilter.length === 0 || typeFilter.includes("artifact")) {
      const artQuery = await artifactRegistry.query({ search: q, limit: 100 });
      for (const art of artQuery.items) {
        const score = getScore(art.name, art.description || "");
        if (score > 0 || !q) {
          results.push({
            id: art.id,
            title: art.name,
            description: art.description || `Artifact file: ${art.name}`,
            type: "artifact",
            score: score || 10,
            uri: art.storage.uri,
            highlights: [],
            metadata: {
              tags: art.tags,
              size: art.size,
              lifecycleState: art.lifecycleState
            }
          });
        }
      }
    }

    // 2. Search Jobs
    if (typeFilter.length === 0 || typeFilter.includes("job")) {
      const jobs = await jobQueue.getJobs();
      for (const job of jobs) {
        const score = getScore(job.name, job.status);
        if (score > 0 || !q) {
          results.push({
            id: job.id,
            title: `Job: ${job.name}`,
            description: `Background processing pipeline status: ${job.status}. Progress: ${job.progress}%`,
            type: "job",
            score: score || 10,
            uri: `/api/v1/jobs?id=${job.id}`,
            highlights: [],
            metadata: {
              status: job.status,
              createdAt: job.createdAt,
              priority: job.priority
            }
          });
        }
      }
    }

    // 3. Search Services
    if (typeFilter.length === 0 || typeFilter.includes("service")) {
      const services = await deploymentManager.getServicesStatus();
      for (const s of services) {
        const score = getScore(s.name, s.description);
        if (score > 0 || !q) {
          results.push({
            id: s.id,
            title: `Service: ${s.name}`,
            description: s.description,
            type: "service",
            score: score || 10,
            uri: `/api/v1/services`,
            highlights: [],
            metadata: {
              port: s.port,
              status: s.status,
              pid: s.pid
            }
          });
        }
      }
    }

    // 4. Search MCP Servers
    if (typeFilter.length === 0 || typeFilter.includes("mcp_server")) {
      const mcpServers = [
        { name: "filesystem", type: "Local Directory", description: "Direct read and write access to files in target source directory." },
        { name: "git", type: "Git Version Control", description: "Enables code revision diagnostics, logs, and delta comparisons." },
        { name: "sqlite", type: "Local Database Access", description: "Maintains session states and agent database profiles." },
        { name: "raja-knowledge-repository", type: "RAG Context Index", description: "Vector-supported search of guidelines and playbook folders." }
      ];

      for (const m of mcpServers) {
        const score = getScore(m.name, m.description);
        if (score > 0 || !q) {
          results.push({
            id: `mcp-${m.name}`,
            title: `MCP Server: ${m.name}`,
            description: `${m.type} - ${m.description}`,
            type: "mcp_server",
            score: score || 10,
            uri: `/api/v1/agents`,
            highlights: [],
            metadata: {
              serverType: m.type
            }
          });
        }
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Apply pagination
    const paginated = results.slice(offset, offset + limit);
    return NextResponse.json(paginated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
