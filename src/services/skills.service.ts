// src/services/skills.service.ts
// Domain-Driven Skill Framework Service for AegisOS

import prisma from "../infrastructure/db/prisma";
import { 
  SkillDefinition, 
  SkillExecutionRecord, 
  SkillExecutionStep, 
  SandboxPolicy, 
  SkillMetric, 
  DiscoveryResult 
} from "../types/skills";

export class SkillsService {
  private static instance: SkillsService | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SkillsService {
    if (!SkillsService.instance) {
      SkillsService.instance = new SkillsService();
    }
    return SkillsService.instance;
  }

  // --- Initialize & Seed Default Skills ---
  public async init(force = false): Promise<void> {
    if (this.isInitialized && !force) return;
    if (force) {
      this.isInitialized = false;
    }
    
    try {
      const count = await prisma.skill.count();
      if (count === 0 || force) {
        console.log("[SkillsService] Seeding default capability domain skills...");
        const defaultSkills = this.getDefaultSkills();
        for (const skill of defaultSkills) {
          await prisma.skill.upsert({
            where: { id: skill.id },
            update: {
              name: skill.name,
              purpose: skill.purpose,
              domain: skill.domain,
              version: skill.version,
              status: skill.status,
              triggers: JSON.stringify(skill.triggers),
              prerequisites: JSON.stringify(skill.prerequisites),
              dependencies: JSON.stringify(skill.dependencies),
              supportedTools: JSON.stringify(skill.supportedTools),
              inputSchema: JSON.stringify(skill.inputSchema),
              outputSchema: JSON.stringify(skill.outputSchema),
              confidenceScore: skill.confidenceScore,
              executionCost: skill.executionCost,
              latencyMs: skill.latencyMs,
              sandboxPolicy: JSON.stringify(skill.sandboxPolicy),
              permissions: JSON.stringify(skill.permissions),
              metadata: JSON.stringify(skill.metadata),
              deletedAt: null
            },
            create: {
              id: skill.id,
              name: skill.name,
              purpose: skill.purpose,
              domain: skill.domain,
              version: skill.version,
              status: skill.status,
              triggers: JSON.stringify(skill.triggers),
              prerequisites: JSON.stringify(skill.prerequisites),
              dependencies: JSON.stringify(skill.dependencies),
              supportedTools: JSON.stringify(skill.supportedTools),
              inputSchema: JSON.stringify(skill.inputSchema),
              outputSchema: JSON.stringify(skill.outputSchema),
              confidenceScore: skill.confidenceScore,
              executionCost: skill.executionCost,
              latencyMs: skill.latencyMs,
              sandboxPolicy: JSON.stringify(skill.sandboxPolicy),
              permissions: JSON.stringify(skill.permissions),
              metadata: JSON.stringify(skill.metadata),
            }
          });
        }
      }
      this.isInitialized = true;
    } catch (error) {
      console.error("[SkillsService] Failed to initialize skills registry:", error);
    }
  }

  // --- Skill Registry CRUD ---
  public async getSkills(): Promise<SkillDefinition[]> {
    await this.init();
    const records = await prisma.skill.findMany({
      where: { deletedAt: null }
    });

    return records.map(r => this.mapRecordToSkill(r));
  }

  public async getSkill(id: string): Promise<SkillDefinition | null> {
    await this.init();
    const r = await prisma.skill.findUnique({
      where: { id }
    });
    if (!r || r.deletedAt) return null;
    return this.mapRecordToSkill(r);
  }

  public async registerSkill(skill: SkillDefinition): Promise<void> {
    await this.init();
    
    // Validate semantic version syntax
    if (!/^\d+\.\d+\.\d+$/.test(skill.version)) {
      throw new Error(`Invalid semantic version: ${skill.version}`);
    }

    // Check circular dependencies
    await this.verifyDependencyGraph([...skill.dependencies, skill.id], skill);

    await prisma.skill.upsert({
      where: { id: skill.id },
      update: {
        name: skill.name,
        purpose: skill.purpose,
        domain: skill.domain,
        version: skill.version,
        status: skill.status,
        triggers: JSON.stringify(skill.triggers),
        prerequisites: JSON.stringify(skill.prerequisites),
        dependencies: JSON.stringify(skill.dependencies),
        supportedTools: JSON.stringify(skill.supportedTools),
        inputSchema: JSON.stringify(skill.inputSchema),
        outputSchema: JSON.stringify(skill.outputSchema),
        confidenceScore: skill.confidenceScore,
        executionCost: skill.executionCost,
        latencyMs: skill.latencyMs,
        sandboxPolicy: JSON.stringify(skill.sandboxPolicy),
        permissions: JSON.stringify(skill.permissions),
        metadata: JSON.stringify(skill.metadata),
        deletedAt: null
      },
      create: {
        id: skill.id,
        name: skill.name,
        purpose: skill.purpose,
        domain: skill.domain,
        version: skill.version,
        status: skill.status,
        triggers: JSON.stringify(skill.triggers),
        prerequisites: JSON.stringify(skill.prerequisites),
        dependencies: JSON.stringify(skill.dependencies),
        supportedTools: JSON.stringify(skill.supportedTools),
        inputSchema: JSON.stringify(skill.inputSchema),
        outputSchema: JSON.stringify(skill.outputSchema),
        confidenceScore: skill.confidenceScore,
        executionCost: skill.executionCost,
        latencyMs: skill.latencyMs,
        sandboxPolicy: JSON.stringify(skill.sandboxPolicy),
        permissions: JSON.stringify(skill.permissions),
        metadata: JSON.stringify(skill.metadata),
      }
    });
  }

  public async toggleSkill(id: string, enabled: boolean): Promise<boolean> {
    await this.init();
    try {
      await prisma.skill.update({
        where: { id },
        data: { status: enabled ? "enabled" : "disabled" }
      });
      return true;
    } catch {
      return false;
    }
  }

  public async deleteSkill(id: string): Promise<boolean> {
    await this.init();
    try {
      await prisma.skill.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
      return true;
    } catch {
      return false;
    }
  }

  // --- Discovery Engine ---
  public async discoverSkills(intent: string): Promise<DiscoveryResult[]> {
    const allSkills = await this.getSkills();
    const query = intent.toLowerCase();
    const results: DiscoveryResult[] = [];

    for (const skill of allSkills) {
      if (skill.status !== "enabled") continue;

      let score = 0;
      let matchType: "trigger" | "domain" | "semantic" = "semantic";

      // 1. Direct Domain Match
      if (skill.domain.toLowerCase().includes(query) || query.includes(skill.domain.toLowerCase())) {
        score += 0.85;
        matchType = "domain";
      }

      // 2. Trigger Keyword Match
      const matchedTriggers = skill.triggers.filter(t => query.includes(t.toLowerCase()));
      if (matchedTriggers.length > 0) {
        score += 0.9 * (matchedTriggers.length / skill.triggers.length);
        matchType = "trigger";
      }

      // 3. Purpose/Name Search Match
      if (skill.name.toLowerCase().includes(query) || skill.purpose.toLowerCase().includes(query)) {
        score += 0.5;
      }

      // Adjust based on base confidence scoring model
      if (score > 0) {
        const finalScore = Math.min(score * skill.confidenceScore, 1.0);
        results.push({
          skill,
          confidenceScore: parseFloat(finalScore.toFixed(2)),
          matchType
        });
      }
    }

    // Sort by confidence score descending, then by cost (lower first), then by latency (lower first)
    return results.sort((a, b) => {
      if (b.confidenceScore !== a.confidenceScore) {
        return b.confidenceScore - a.confidenceScore;
      }
      if (a.skill.executionCost !== b.skill.executionCost) {
        return a.skill.executionCost - b.skill.executionCost;
      }
      return a.skill.latencyMs - b.skill.latencyMs;
    });
  }

  // --- Dependency Graph Validation ---
  public async verifyDependencyGraph(skillsChain: string[], pendingSkill?: SkillDefinition): Promise<void> {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const checkCycle = async (id: string) => {
      if (stack.has(id)) {
        throw new Error(`Circular dependency detected involving skill ID: ${id}`);
      }
      if (visited.has(id)) return;

      visited.add(id);
      stack.add(id);

      const skill = (pendingSkill && pendingSkill.id === id)
        ? pendingSkill
        : await this.getSkill(id);

      if (skill) {
        for (const depId of skill.dependencies) {
          await checkCycle(depId);
        }
      }

      stack.delete(id);
    };

    for (const skillId of skillsChain) {
      await checkCycle(skillId);
    }
  }

  // --- Skill Composition Engine ---
  public async composeSkills(skillIds: string[]): Promise<{
    compatible: boolean;
    pipeline: string[];
    errors: string[];
  }> {
    const pipeline: string[] = [];
    const errors: string[] = [];

    // Verify dynamic dependencies and resolve ordering
    try {
      await this.verifyDependencyGraph(skillIds);
    } catch (err: any) {
      errors.push(err.message);
      return { compatible: false, pipeline, errors };
    }

    // Dependency topological sorting (simplistic resolution)
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = async (id: string) => {
      if (temp.has(id)) return; // Checked in cycle validation
      if (visited.has(id)) return;

      temp.add(id);
      const skill = await this.getSkill(id);
      if (skill) {
        for (const dep of skill.dependencies) {
          await visit(dep);
        }
      }
      temp.delete(id);
      visited.add(id);
      pipeline.push(id);
    };

    for (const id of skillIds) {
      await visit(id);
    }

    // Input/Output schema compatibility checks
    for (let i = 0; i < pipeline.length - 1; i++) {
      const current = await this.getSkill(pipeline[i]);
      const next = await this.getSkill(pipeline[i + 1]);

      if (current && next) {
        // Simple schema validation check (output fields match next input expectations)
        const currentOutputs = Object.keys(current.outputSchema.properties || {});
        const nextInputs = Object.keys(next.inputSchema.properties || {});
        
        // Find if next requires keys that current output doesn't supply, unless optional
        const requiredNextInputs = next.inputSchema.required || [];
        const missing = requiredNextInputs.filter((k: string) => !currentOutputs.includes(k));
        
        if (missing.length > 0) {
          errors.push(`Incompatibility: Step '${current.name}' output does not provide required field(s) [${missing.join(", ")}] for Step '${next.name}'.`);
        }
      }
    }

    return {
      compatible: errors.length === 0,
      pipeline,
      errors
    };
  }

  // --- Policy checks & Sandboxing ---
  private checkSandboxPolicy(policy: SandboxPolicy, input: any): void {
    // 1. Filesystem Policy Check
    if (!policy.allowFileSystem) {
      // Look for paths or file operations in the input parameters
      const inputStr = JSON.stringify(input).toLowerCase();
      if (inputStr.includes("file:") || inputStr.includes("/") || inputStr.includes("\\") || inputStr.includes("path")) {
        throw new Error("Sandbox Violation: File system access is restricted for this skill.");
      }
    } else if (policy.allowedPaths && policy.allowedPaths.length > 0) {
      // Look if any input path matches the allowedPaths
      const inputPath = input.path || input.filePath || input.directory || "";
      if (inputPath) {
        const normalizedInput = inputPath.replace(/\\/g, "/");
        const isAllowed = policy.allowedPaths.some(p => normalizedInput.startsWith(p));
        if (!isAllowed) {
          throw new Error(`Sandbox Violation: Access to path '${inputPath}' is not authorized by policies.`);
        }
      }
    }

    // 2. Network Policy Check
    if (!policy.allowNetwork) {
      const inputStr = JSON.stringify(input).toLowerCase();
      if (inputStr.includes("http://") || inputStr.includes("https://") || inputStr.includes("fetch") || inputStr.includes("url")) {
        throw new Error("Sandbox Violation: Outbound network calls are blocked for this skill.");
      }
    } else if (policy.allowedHosts && policy.allowedHosts.length > 0) {
      const inputUrl = input.url || input.host || "";
      if (inputUrl) {
        try {
          const host = new URL(inputUrl).hostname;
          const isAllowed = policy.allowedHosts.some(h => h === "*" || host.endsWith(h));
          if (!isAllowed) {
            throw new Error(`Sandbox Violation: Network access to host '${host}' is blocked.`);
          }
        } catch {
          // If not a valid URL but host provided
          const isAllowed = policy.allowedHosts.some(h => h === "*" || inputUrl.includes(h));
          if (!isAllowed) {
            throw new Error(`Sandbox Violation: Network access to host '${inputUrl}' is blocked.`);
          }
        }
      }
    }
  }

  // --- Execution & Orchestration Engine (with Retry/Recovery) ---
  public async executeSkill(
    skillId: string, 
    input: any, 
    options?: { parentId?: string; workflowId?: string }
  ): Promise<SkillExecutionRecord> {
    await this.init();
    const skill = await this.getSkill(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }
    if (skill.status !== "enabled") {
      throw new Error(`Skill ${skill.name} is currently disabled.`);
    }

    const trace: SkillExecutionStep[] = [];
    const execId = `sk-exec-${Math.random().toString(36).substring(2, 9)}`;
    const createdAt = new Date().toISOString();

    trace.push({
      id: `${execId}-step-1`,
      name: "Initialization",
      status: "completed",
      timestamp: new Date().toISOString(),
      message: `Execution init for skill: ${skill.name} (v${skill.version})`
    });

    const executionRecord = await prisma.skillExecution.create({
      data: {
        id: execId,
        skillId,
        status: "running",
        input: JSON.stringify(input),
        trace: JSON.stringify(trace),
        retryCount: 0,
        maxRetries: 3,
        parentId: options?.parentId,
        workflowId: options?.workflowId,
      }
    });

    const startTime = Date.now();
    let currentRetry = 0;
    const maxRetries = 3;
    let output: any = null;
    let finalError: string | null = null;

    // Retry loop with exponential backoff
    while (currentRetry <= maxRetries) {
      try {
        trace.push({
          id: `${execId}-step-trace-${currentRetry}`,
          name: currentRetry === 0 ? "Execution attempt" : `Retry Attempt #${currentRetry}`,
          status: "running",
          timestamp: new Date().toISOString(),
        });

        // 1. Sandbox Policy Guard
        this.checkSandboxPolicy(skill.sandboxPolicy, input);

        // 2. Mock execution logic matching domains
        output = await this.simulateDomainExecution(skill, input, execId, trace);
        
        trace.push({
          id: `${execId}-step-success-${currentRetry}`,
          name: "Execution Completed",
          status: "completed",
          timestamp: new Date().toISOString(),
          message: `Successfully executed skill ${skill.name}.`
        });
        break; // Exit retry loop on success
      } catch (err: any) {
        console.warn(`[SkillsService] Skill execution attempt ${currentRetry} failed:`, err.message);
        currentRetry++;
        
        trace.push({
          id: `${execId}-step-fail-${currentRetry}`,
          name: `Attempt #${currentRetry - 1} Failed`,
          status: "failed",
          timestamp: new Date().toISOString(),
          message: err.message
        });

        if (currentRetry > maxRetries) {
          finalError = err.message;
          // Log sandbox violations specifically to telemetry
          if (err.message.includes("Sandbox Violation")) {
            await this.logTelemetry(skillId, "sandbox_violation", 1.0);
          }
          break;
        }

        // Exponential backoff
        const backoffMs = Math.pow(2, currentRetry) * 200;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }

    const durationMs = Date.now() - startTime;
    const finalStatus = finalError ? "failed" : "succeeded";

    // Update execution history
    const finalRecord = await prisma.skillExecution.update({
      where: { id: execId },
      data: {
        status: finalStatus,
        output: output ? JSON.stringify(output) : null,
        error: finalError,
        durationMs,
        cost: skill.executionCost,
        trace: JSON.stringify(trace),
        retryCount: currentRetry
      }
    });

    // Write metric log to Telemetry
    await this.logTelemetry(skillId, "latency", durationMs);
    await this.logTelemetry(skillId, "cost", skill.executionCost);
    await this.logTelemetry(skillId, finalStatus === "succeeded" ? "success" : "failure", 1.0);

    return {
      id: finalRecord.id,
      skillId: finalRecord.skillId,
      status: finalRecord.status as any,
      input: JSON.parse(finalRecord.input),
      output: finalRecord.output ? JSON.parse(finalRecord.output) : undefined,
      error: finalRecord.error || undefined,
      durationMs: finalRecord.durationMs || undefined,
      cost: finalRecord.cost || undefined,
      trace,
      retryCount: finalRecord.retryCount,
      maxRetries: finalRecord.maxRetries,
      parentId: finalRecord.parentId || undefined,
      workflowId: finalRecord.workflowId || undefined,
      createdAt: finalRecord.createdAt.toISOString(),
      updatedAt: finalRecord.updatedAt.toISOString(),
    };
  }

  private async simulateDomainExecution(
    skill: SkillDefinition, 
    input: any, 
    execId: string, 
    trace: SkillExecutionStep[]
  ): Promise<any> {
    // Return mock outcomes tailored to the requested domain definitions
    const domain = skill.domain.toLowerCase();

    // Small processing latency simulation
    await new Promise(resolve => setTimeout(resolve, 100));

    switch (skill.id) {
      case "ai-engineering":
        return {
          status: "success",
          selectedBackend: "LiteLLM Router",
          modelRoute: "ollama/smollm:135m",
          activeParameters: { temperature: 0.2, topP: 0.9 },
          optimizedPrompt: input.prompt ? `[System: AI Architect Mode] ${input.prompt}` : "Optimized prompt initialized."
        };
      case "agent-engineering":
        return {
          status: "success",
          subagentsSpawned: ["developer", "reviewer"],
          coordinationPlan: "Developer modifies source files, Reviewer audits and lint checks output.",
          delegatedTaskCount: 2
        };
      case "prompt-engineering":
        return {
          status: "success",
          promptDraft: `## System Prompt\nYou are an expert assistant for ${input.domain || "general engineering"}.\n\n## Constraints\n- Always enforce YAGNI.\n- Avoid redundant dependencies.`,
          estimatedGainPercent: 18.5
        };
      case "rag-knowledge":
        return {
          status: "success",
          matchedDocumentsCount: 4,
          semanticScore: 0.92,
          chunks: [
            "AegisOS supports local vector embeddings using SQLite index stores.",
            "MCP files are registered in the runtime.service registry."
          ]
        };
      case "mcp-development":
        return {
          status: "success",
          serverName: input.serverName || "custom-mcp-server",
          connectionStatus: "online",
          toolsRegistered: ["read_file", "write_file", "search_files"]
        };
      case "software-engineering":
        return {
          status: "success",
          codePatchApplied: true,
          filesModified: ["src/services/runtime.service.ts"],
          compilationResult: "SUCCESS"
        };
      case "code-quality":
        return {
          status: "success",
          eslintErrors: 0,
          prettierFormatPassed: true,
          tsCheckStatus: "CLEAN"
        };
      case "security":
        return {
          status: "success",
          leaksChecked: true,
          credentialsFound: 0,
          owaspScore: 98,
          complianceStatus: "SAIF_COMPLIANT"
        };
      case "architecture":
        return {
          status: "success",
          designModel: "Microservices Container Gateway",
          components: ["AdminPortal", "IngressRouter", "LiteLLMService", "SqliteMetadata"],
          patternsApplied: ["Singleton", "Registry", "Proxy"]
        };
      case "product-management":
        return {
          status: "success",
          epicCreated: "Modular AI Operating System Registry",
          userStories: [
            "As an Operator, I want to toggle skills so I can control agent behavior.",
            "As an Auditor, I want telemetry logs to inspect cost/latency metrics."
          ]
        };
      case "technical-documentation":
        return {
          status: "success",
          readmeGenerated: true,
          adrPath: "docs/adr/0012-skill-framework.md",
          changelogUpdated: true
        };
      case "business-analysis":
        return {
          status: "success",
          swotAnalysis: {
            strengths: ["Local execution", "SaaS multi-tenancy"],
            opportunities: ["Marketplace skill monetization"]
          },
          roadmapPriority: "High"
        };
      case "data-engineering":
        return {
          status: "success",
          dataformCompiled: true,
          dbtModelsRun: 3,
          bigqueryJobsTriggered: 1,
          rowsProcessed: 1450
        };
      case "cloud-engineering":
        return {
          status: "success",
          gcsBucketsVerified: ["aegisos-dev-storage"],
          cloudSqlStatus: "online",
          kubernetesPodsRunning: 5
        };
      case "devops":
        return {
          status: "success",
          dockerComposeStatus: "UP",
          caddyRouteRegistered: true,
          pipelinesTriggered: ["github-ci"]
        };
      case "infrastructure-operations":
        return {
          status: "success",
          backupLocation: "databases/backups/dev-backup.sqlite",
          portsBound: [3000, 19789, 14000],
          healthCheckResult: "HEALTHY"
        };
      case "research":
        return {
          status: "success",
          scrapedUrls: ["https://modelcontextprotocol.io"],
          webResults: [
            { title: "MCP Specification v1.0", snippet: "Standard protocols for AI model tools." }
          ]
        };
      case "workflow-automation":
        return {
          status: "success",
          cronExpression: "0 0 * * *",
          jobEnabled: true,
          nextTriggerDate: new Date(Date.now() + 86400000).toISOString()
        };
      case "diagram-generation":
        return {
          status: "success",
          mermaidCode: "graph TD\n  A[User] -->|Intent| B(Discovery Engine)\n  B -->|Chain| C{Skills Composition}\n  C -->|Execute| D[SkillRegistry]",
          svgOutput: null
        };
      case "business-process-modeling":
        return {
          status: "success",
          bpmnModel: "Stage-1-Request -> Stage-2-ApprovalGate -> Stage-3-Execution",
          requiresQuorum: true,
          approvalTimeoutSeconds: 3600
        };
      case "observability":
        return {
          status: "success",
          prometheusMetricCount: 15,
          grafanaDashboardUpdated: true,
          otelStatus: "CONNECTED"
        };
      case "governance":
        return {
          status: "success",
          quotaCheckPassed: true,
          activeRole: "Operator",
          allowedCommands: ["*"]
        };
      case "compliance":
        return {
          status: "success",
          auditLogId: "audit-skill-exec-log",
          regulatoryCode: "ISO-27001",
          lineageVerified: true
        };
      default:
        return { status: "success", executionId: execId, message: "Standard execution outcome." };
    }
  }

  // --- Telemetry & Usage Analytics ---
  public async logTelemetry(skillId: string, metricName: string, value: number, metadata?: any): Promise<void> {
    try {
      await prisma.skillTelemetry.create({
        data: {
          skillId,
          metricName,
          value,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });
    } catch (e) {
      console.error("[SkillsService] Failed to log telemetry:", e);
    }
  }

  public async getSkillMetrics(skillId: string): Promise<SkillMetric> {
    await this.init();
    
    // Default fallback values
    let totalExecutions = 0;
    let successes = 0;
    let avgDurationMs = 0;
    let avgCost = 0;
    let sandboxViolations = 0;

    try {
      const execs = await prisma.skillExecution.findMany({
        where: { skillId }
      });
      totalExecutions = execs.length;
      successes = execs.filter(e => e.status === "succeeded").length;
      
      const durationSum = execs.reduce((acc, e) => acc + (e.durationMs || 0), 0);
      avgDurationMs = totalExecutions > 0 ? durationSum / totalExecutions : 0;

      const costSum = execs.reduce((acc, e) => acc + (e.cost || 0), 0);
      avgCost = totalExecutions > 0 ? costSum / totalExecutions : 0;

      const violations = await prisma.skillTelemetry.count({
        where: { skillId, metricName: "sandbox_violation" }
      });
      sandboxViolations = violations;
    } catch {}

    return {
      skillId,
      totalExecutions,
      successRate: totalExecutions > 0 ? parseFloat((successes / totalExecutions).toFixed(2)) : 1.0,
      avgDurationMs: Math.round(avgDurationMs),
      avgCost: parseFloat(avgCost.toFixed(3)),
      sandboxViolations
    };
  }

  public async getAnalytics(): Promise<{
    totalExecs: number;
    avgLatency: number;
    totalCost: number;
    violationsCount: number;
    topSkills: { skillId: string; count: number }[];
    latencyHistory: { timestamp: string; value: number }[];
  }> {
    await this.init();

    let totalExecs = 0;
    let avgLatency = 0;
    let totalCost = 0;
    let violationsCount = 0;
    const topSkills: { skillId: string; count: number }[] = [];
    const latencyHistory: { timestamp: string; value: number }[] = [];

    try {
      totalExecs = await prisma.skillExecution.count();
      violationsCount = await prisma.skillTelemetry.count({ where: { metricName: "sandbox_violation" } });
      
      const latencySum = await prisma.skillTelemetry.aggregate({
        where: { metricName: "latency" },
        _avg: { value: true }
      });
      avgLatency = Math.round(latencySum._avg.value || 0);

      const costSum = await prisma.skillTelemetry.aggregate({
        where: { metricName: "cost" },
        _sum: { value: true }
      });
      totalCost = parseFloat((costSum._sum.value || 0).toFixed(2));

      // Group top skills
      const skillGroups = await prisma.skillExecution.groupBy({
        by: ["skillId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5
      });
      
      skillGroups.forEach(g => {
        topSkills.push({ skillId: g.skillId, count: g._count.id });
      });

      // Latency history
      const history = await prisma.skillTelemetry.findMany({
        where: { metricName: "latency" },
        orderBy: { timestamp: "desc" },
        take: 10
      });

      history.forEach(h => {
        latencyHistory.push({ timestamp: h.timestamp.toISOString(), value: h.value });
      });
    } catch {}

    return {
      totalExecs,
      avgLatency,
      totalCost,
      violationsCount,
      topSkills,
      latencyHistory: latencyHistory.reverse()
    };
  }

  // --- Helper Helpers ---
  private mapRecordToSkill(r: any): SkillDefinition {
    return {
      id: r.id,
      name: r.name,
      purpose: r.purpose,
      domain: r.domain,
      version: r.version,
      status: r.status as any,
      triggers: JSON.parse(r.triggers),
      prerequisites: JSON.parse(r.prerequisites),
      dependencies: JSON.parse(r.dependencies),
      supportedTools: JSON.parse(r.supportedTools),
      inputSchema: JSON.parse(r.inputSchema),
      outputSchema: JSON.parse(r.outputSchema),
      confidenceScore: r.confidenceScore,
      executionCost: r.executionCost,
      latencyMs: r.latencyMs,
      sandboxPolicy: JSON.parse(r.sandboxPolicy),
      permissions: JSON.parse(r.permissions),
      metadata: JSON.parse(r.metadata),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  // --- Mock Seed Data Generator ---
  private getDefaultSkills(): SkillDefinition[] {
    const domains = [
      { id: "ai-engineering", name: "AI Engineering", purpose: "Manage local LLM parameterization, LiteLLM routes and router optimizations.", triggers: ["ollama", "litellm", "model parameters", "ai backend", "completion"], tools: ["mcp_minimax_call", "ollama_chat"] },
      { id: "agent-engineering", name: "Agent Engineering", purpose: "Orchestrate multi-agent networks, task planning, subagent spawning, and worker thread lifecycle controls.", triggers: ["agent", "subagent", "orchestration", "worker", "spawn", "coordination"], tools: ["mcp_desktop-commander_execute"] },
      { id: "prompt-engineering", name: "Prompt Engineering", purpose: "Iterate prompts, run prompt optimization heuristics (SkillOpt), and refine system instructions.", triggers: ["prompt", "optimization", "system prompt", "instruction", "skillopt"], tools: ["skill_workshop"] },
      { id: "rag-knowledge", name: "RAG & Knowledge Systems", purpose: "Query semantic data indexes, search vector databases, and format RAG context injected vectors.", triggers: ["rag", "knowledge base", "vector search", "embedding", "semantic retrieval"], tools: ["mcp_obsidian_search"] },
      { id: "mcp-development", name: "MCP Development", purpose: "Configure Model Context Protocol servers, auto-install packages, and troubleshoot tool bindings.", triggers: ["mcp", "model context protocol", "server config", "custom tool", "mcp command"], tools: ["mcp_filesystem_read"] },
      { id: "software-engineering", name: "Software Engineering", purpose: "Write clean modular code, execute compiler operations, apply patches, and refactor classes.", triggers: ["refactor", "patch", "git commit", "code generation", "compilation", "write code"], tools: ["mcp_git_commit", "mcp_filesystem_write"] },
      { id: "code-quality", name: "Code Quality", purpose: "Verify code style rules, compile TS check diagnostics, and run ESLint/Prettier format routines.", triggers: ["lint", "format", "eslint", "prettier", "ts checks", "lint error"], tools: ["mcp_command-execution_run"] },
      { id: "security", name: "Security", purpose: "Scan files for credential leakage, audit security configuration compliance, and block WMI intrusion risks.", triggers: ["credential leak", "owasp", "vulnerability scan", "saif compliance", "secrets", "intrusion"], tools: ["mcp_sentry_list"] },
      { id: "architecture", name: "Architecture", purpose: "Evaluate system patterns, modularize components, and generate technical architectures.", triggers: ["design patterns", "architecture definition", "uml", "sysml", "system diagram"], tools: ["mcp_figma_import"] },
      { id: "product-management", name: "Product Management", purpose: "Generate epic descriptions, track user stories backlog, and define business outcomes constraints.", triggers: ["roadmap", "user story", "backlog", "features spec", "acceptance criteria"], tools: ["mcp_jira_create"] },
      { id: "technical-documentation", name: "Technical Documentation", purpose: "Author README files, draft Architecture Decision Records (ADR), and maintain project CHANGELOG.", triggers: ["readme", "documentation", "changelog", "adr", "docstrings"], tools: ["mcp_overleaf_sync"] },
      { id: "business-analysis", name: "Business Analysis", purpose: "Evaluate domain priorities, trace cost implications, and compile competitive SWOT models.", triggers: ["market research", "financial modeling", "swot", "business plan", "tco"], tools: ["mcp_stripe_invoice"] },
      { id: "data-engineering", name: "Data Engineering", purpose: "Compose BigQuery analytics queries, execute dbt builds, and configure Dataform schedules.", triggers: ["bigquery", "dbt", "dataform", "etl pipeline", "sqlx"], tools: ["mcp_postgres_query", "mcp_snowflake_query"] },
      { id: "cloud-engineering", name: "Cloud Engineering", purpose: "Manage Google Cloud Storage (GCS), provision AWS buckets, and scale Kubernetes pods.", triggers: ["gcp", "aws", "cloud storage", "kubernetes", "s3 bucket"], tools: ["mcp_kubernetes_deploy", "mcp_aws_describe"] },
      { id: "devops", name: "DevOps", purpose: "Deploy configuration infrastructure, write Dockerfiles, and establish CI/CD pipeline automation.", triggers: ["docker-compose", "caddyfile", "deploy script", "ci/cd", "dockerfile"], tools: ["mcp_docker_build"] },
      { id: "infrastructure-operations", name: "Infrastructure Operations", purpose: "Orchestrate hardware telemetry backup routines, test TCP ports, and check network gateways.", triggers: ["backup", "restore", "system service", "port binding", "wmi hardware"], tools: ["mcp_netdata_check"] },
      { id: "research", name: "Research", purpose: "Trigger Google/Brave web search, retrieve Wikipedia knowledge, and scrape competitor HTML.", triggers: ["web search", "google search", "scraping", "crawl", "brave search"], tools: ["mcp_brave-search_web", "mcp_fetch_url"] },
      { id: "workflow-automation", name: "Workflow Automation", purpose: "Configure cron schedulers, register trigger webhooks, and map async worker queues.", triggers: ["cron", "trigger", "workflow design", "scheduler", "webhook"], tools: ["mcp_zapier_trigger"] },
      { id: "diagram-generation", name: "Diagram Generation", purpose: "Render system structures in Mermaid format, create flowchart diagrams, and generate graphs.", triggers: ["mermaid", "flowchart", "diagram design", "draw", "render chart"], tools: ["mcp_markitdown_convert"] },
      { id: "business-process-modeling", name: "Business Process Modeling", purpose: "Model business workflows, construct approval gates, and verify quorum conditions.", triggers: ["bpmn", "approval gate", "business workflow", "quorum", "escalation"], tools: ["mcp_asana_task"] },
      { id: "observability", name: "Observability", purpose: "Collect Prometheus metrics, build Grafana dashboards, and track OpenTelemetry spans.", triggers: ["prometheus", "grafana", "opentelemetry", "metrics log", "alerts", "sentry errors"], tools: ["mcp_prometheus_query", "mcp_grafana_dashboard"] },
      { id: "governance", name: "Governance", purpose: "Audit tenant network limits, enforce quotas constraints, and verify role-based permissions.", triggers: ["access role", "quota limit", "governance policy", "licensing", "whitelist"], tools: ["mcp_atlassian_audit"] },
      { id: "compliance", name: "Compliance", purpose: "Record data lineage, verify compliance code ISO checks, and audit logging histories.", triggers: ["audit log", "regulatory", "data lineage", "security compliance", "gitleaks"], tools: ["mcp_sentry_issue"] }
    ];

    const defaultSandbox: SandboxPolicy = {
      allowNetwork: false,
      allowedHosts: [],
      allowFileSystem: false,
      allowedPaths: []
    };

    return domains.map(d => {
      const isSystem = ["ai-engineering", "agent-engineering", "prompt-engineering", "security"].includes(d.id);
      
      return {
        id: d.id,
        name: d.name,
        purpose: d.purpose,
        domain: d.name,
        version: "1.0.0",
        status: "enabled",
        triggers: d.triggers,
        prerequisites: isSystem ? ["AegisOS-Core"] : ["Node-Run"],
        dependencies: isSystem ? [] : ["ai-engineering", "agent-engineering"],
        supportedTools: d.tools,
        inputSchema: {
          type: "object",
          properties: {
            task: { type: "string", description: "Target task query description." }
          },
          required: ["task"]
        },
        outputSchema: {
          type: "object",
          properties: {
            status: { type: "string" },
            result: { type: "object" }
          }
        },
        confidenceScore: 0.95,
        executionCost: isSystem ? 0.005 : 0.015,
        latencyMs: 150,
        sandboxPolicy: {
          ...defaultSandbox,
          allowNetwork: d.id === "research" || d.id === "cloud-engineering",
          allowedHosts: d.id === "research" ? ["*"] : [],
          allowFileSystem: d.id === "software-engineering" || d.id === "devops",
          allowedPaths: d.id === "software-engineering" ? ["D:/AegisOS"] : []
        },
        permissions: ["execute_tools"],
        metadata: { category: "system-core", provider: "aegisos" }
      };
    });
  }
}

export const skillsService = SkillsService.getInstance();
export default skillsService;
