import { NextRequest, NextResponse } from "next/server";
import { artifactRegistry } from "@/infrastructure/sdk/platform-sdk";
import { jobQueue } from "@/infrastructure/sdk/platform-sdk";
import { deploymentManager } from "@/infrastructure/sdk/platform-sdk";
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
        { name: "markitdown", type: "Multi-Modal Converter", description: "Converts multi-modal formats (PDF, Word, Excel, images, audio) into readable Markdown." },
        { name: "figma", type: "Design System Integrator", description: "Pulls spatial design context, visual nodes, and component data directly into workflows." },
        { name: "minimax", type: "Generative AI API", description: "Exposes text-to-speech, image, and video generation APIs for AI agents." },
        { name: "filesystem", type: "Local Directory", description: "Grants agents direct read/write access to local directories and unstructured file data." },
        { name: "github", type: "GitHub Integration", description: "Retrieves repository context, pull requests, issue tracking, and CI/CD workflows." },
        { name: "chrome-devtools", type: "Browser Controller", description: "Controls and inspects live browser sessions for coding and layout agents." },
        { name: "playwright", type: "Browser Automation", description: "Automates web browsers using accessibility trees for testing and DOM extraction." },
        { name: "firecrawl", type: "Web Crawler", description: "Crawls and extracts structured data from dynamic web pages." },
        { name: "tavily", type: "Web Search Engine", description: "Executes agent-optimized real-time web search and synthesis." },
        { name: "notion", type: "Knowledge Workspace", description: "Reads and writes internal workspace documentation, knowledge bases, and databases." },
        { name: "atlassian", type: "Project Memory Manager", description: "Connects to Jira, Confluence, and Opsgenie for project tracking and memory." },
        { name: "dbhub", type: "Multi-DB Query Engine", description: "Executes direct SQL queries across PostgreSQL, MySQL, SQLite, and MariaDB." },
        { name: "stripe", type: "Financial Context API", description: "Retrieves customer, product, and billing data for financial context." },
        { name: "cloudflare", type: "Cloud Resource Manager", description: "Configures and interrogates cloud resources like Workers, KV, and R2 storage." },
        { name: "netdata", type: "Infrastructure Monitor", description: "Ingests real-time infrastructure monitoring, metrics, and anomaly detection." },
        { name: "unity", type: "3D Environment Controller", description: "Bridges commands to the Unity Editor to control 3D environments and game assets." },
        { name: "overleaf", type: "LaTeX Document Compiler", description: "Manages revision-checked LaTeX editing and academic document compilation." },
        { name: "google-drive", type: "Cloud Storage Search", description: "Searches and retrieves enterprise documents and cloud files." },
        { name: "slack", type: "Chat Context Extractor", description: "Extracts real-time communication context and thread history." },
        { name: "desktop-commander", type: "System Process Manager", description: "Executes terminal commands and manages local system processes." },
        { name: "git", type: "Git Version Control", description: "Enables code revision diagnostics, logs, and delta comparisons." },
        { name: "sqlite", type: "Local Database Access", description: "Maintains session states and agent database profiles." },
        { name: "raja-knowledge-repository", type: "RAG Context Index", description: "Vector-supported search of guidelines and playbook folders." },
        
        // 34 Unique New MCP Servers
        { name: "confluence", type: "Collaborative Documentation", description: "Searches and updates organizational workspace documentation and meeting logs." },
        { name: "memory", type: "Session Knowledge Graph", description: "Maintains persistent, entity-based knowledge graphs across agent sessions." },
        { name: "gitlab", type: "Git Version Control & CI", description: "Interfaces with code repositories, CI/CD pipelines, and container registries." },
        { name: "docker", type: "Container Manager", description: "Controls, builds, and inspects local docker containers and images." },
        { name: "kubernetes", type: "Cluster Orchestrator", description: "Manages pod deployments, configurations, and logs in Kubernetes clusters." },
        { name: "postgres", type: "PostgreSQL Database", description: "Connects to PostgreSQL instances to execute queries and manage schemas." },
        { name: "snowflake", type: "Data Warehouse", description: "Executes analytical queries over enterprise data warehouses." },
        { name: "mysql", type: "MySQL Database", description: "Connects to MySQL databases to run queries and retrieve tables." },
        { name: "fetch", type: "Web Content Downloader", description: "Fetches HTML content and extracts raw page text." },
        { name: "brave-search", type: "Web Search Engine", description: "Executes internet-wide queries for real-time factual data retrieval." },
        { name: "linear", type: "Issue Tracker", description: "Tracks software development issues, cycles, and project states." },
        { name: "jira", type: "Project Issue Management", description: "Connects to Jira to query projects, assign tasks, and track sprints." },
        { name: "asana", type: "Task & Timeline Tracker", description: "Pulls task assignments, project timelines, and dependency graphs." },
        { name: "gmail", type: "Email Gateway", description: "Searches, drafts, and sends emails via SMTP/IMAP interfaces." },
        { name: "discord", type: "Community Comms API", description: "Ingests community discussions, server context, and real-time alerts." },
        { name: "command-execution", type: "Secure Shell Executor", description: "Executes terminal commands and runs system scripts locally." },
        { name: "ssh", type: "Secure Remote Tunnel", description: "Bridges secure command-line interfaces to remote servers." },
        { name: "elevenlabs", type: "Text-to-Speech API", description: "Synthesizes high-fidelity AI voice audio from text parameters." },
        { name: "ffmpeg", type: "Media Transcoder CLI", description: "Processes, cuts, and transcodes audio and video assets." },
        { name: "youtube", type: "Video Meta Ingestor", description: "Fetches video transcripts and metadata for video-to-text synthesis." },
        { name: "prometheus", type: "Infrastructure Metrics", description: "Queries time-series infrastructure monitoring and alerting logs." },
        { name: "grafana", type: "Metrics Dashboard API", description: "Pulls analytical logs and visual panels from Grafana servers." },
        { name: "obsidian", type: "Markdown Vault Reader", description: "Reads local markdown vaults for interconnected personal knowledge graphs." },
        { name: "google-workspace", type: "Workspace Suite API", description: "Extracts scheduling context, meeting notes, and email correspondence." },
        { name: "miro", type: "Virtual Whiteboard", description: "Interacts with infinite-canvas whiteboards and spatial diagrams." },
        { name: "airtable", type: "NoSQL Spreadsheet API", description: "Queries dynamic spreadsheet-database records and linked fields." },
        { name: "browserbase", type: "Headless Browser Fleet", description: "Manages headless browser fleets for large-scale web scraping and interaction." },
        { name: "sentry", type: "Error Tracking System", description: "Retrieves application error logs, stack traces, and performance bottlenecks." },
        { name: "aws", type: "Cloud Resource API", description: "Manages cloud infrastructure provisioning and queries EC2/S3 resources." },
        { name: "weaviate", type: "Semantic Vector Search", description: "Performs semantic vector searches over unstructured proprietary documents." },
        { name: "zapier", type: "Cross-Platform Automations", description: "Triggers cross-platform automation workflows and sequential actions." },
        { name: "zendesk", type: "Customer Support Ingestor", description: "Reads customer support tickets, knowledge base articles, and resolution histories." },
        { name: "google-maps", type: "Geospatial Navigation", description: "Extracts geospatial data, local business information, and routing logic." },
        { name: "twilio", type: "Telephony & SMS API", description: "Automates telephony workflows, SMS messaging, and communication logging." }
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
