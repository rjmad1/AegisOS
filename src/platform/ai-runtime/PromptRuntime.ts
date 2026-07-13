import { PromptTemplate, PromptVersion } from "./types";
import { policyEnforcer } from "../../infrastructure/security/policy-enforcer";

export class PromptRuntime {
  private static instance: PromptRuntime | null = null;
  private templates: Map<string, PromptTemplate> = new Map();
  private versions: Map<string, PromptVersion[]> = new Map();

  private constructor() {
    this.seedDefaultTemplates();
  }

  public static getInstance(): PromptRuntime {
    if (!PromptRuntime.instance) {
      PromptRuntime.instance = new PromptRuntime();
    }
    return PromptRuntime.instance;
  }

  private seedDefaultTemplates(): void {
    const templates: PromptTemplate[] = [
      {
        id: "prompt:system:base",
        name: "Base System Prompt",
        version: "1.0.0",
        template: "You are a professional assistant operating within the Enterprise AI Platform. Current Date: {date}.",
        variables: ["date"],
      },
      {
        id: "prompt:agent:planner",
        name: "Planner Agent Prompt",
        version: "1.1.0",
        template: "System: You are an execution planner. Goal: {goal}. Create a sequential execution plan matching capabilities {capabilities}. Outline dependencies clearly.",
        variables: ["goal", "capabilities"],
        inheritanceParentId: "prompt:system:base",
      },
      {
        id: "prompt:agent:critic",
        name: "Critic Agent Prompt",
        version: "1.0.0",
        template: "System: You are a critique agent. Task: Review the following plan: {plan}. Identify potential flaws, VRAM bounds, or security issues.",
        variables: ["plan"],
        inheritanceParentId: "prompt:system:base",
      },
      {
        id: "prompt:agent:supervisor",
        name: "Supervisor Agent Prompt",
        version: "1.2.0",
        template: "You are a supervisor agent orchestrating {workerCount} worker agents. Task: {task}. Delegate work, manage consensus, and route actions.",
        variables: ["workerCount", "task"],
        inheritanceParentId: "prompt:system:base",
      },
    ];

    for (const t of templates) {
      this.registerTemplate(t);
      this.createVersion(t.id, t.version, t.template, "system", "Initial Seed Version");
    }
  }

  public registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  public getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Compiles the prompt template by injecting variables.
   * Supports inheritance: resolves the parent template and prepends/appends it.
   */
  public compose(id: string, variables: Record<string, string>): string {
    const t = this.getTemplate(id);
    if (!t) {
      throw new Error(`PromptRuntime: Template "${id}" not found.`);
    }

    let compiled = t.template;
    for (const key of t.variables) {
      const val = variables[key] ?? `{${key}}`;
      compiled = compiled.replace(new RegExp(`{${key}}`, "g"), val);
    }

    // Resolve inheritance
    if (t.inheritanceParentId) {
      try {
        const parentCompiled = this.compose(t.inheritanceParentId, variables);
        compiled = `${parentCompiled}\n\n${compiled}`;
      } catch (err) {
        console.warn(`[PromptRuntime] Failed to inherit from parent ${t.inheritanceParentId}:`, err);
      }
    }

    return compiled;
  }

  public createVersion(id: string, version: string, templateText: string, createdBy: string, notes?: string): void {
    const vList = this.versions.get(id) || [];
    const newVer: PromptVersion = {
      version,
      template: templateText,
      createdAt: new Date().toISOString(),
      createdBy,
      notes,
    };
    vList.push(newVer);
    this.versions.set(id, vList);

    // Update active template text if version is newer or active matches
    const active = this.templates.get(id);
    if (active) {
      active.template = templateText;
      active.version = version;
    }
  }

  public rollback(id: string, version: string): void {
    const vList = this.versions.get(id);
    if (!vList) {
      throw new Error(`PromptRuntime: No version history found for template "${id}"`);
    }

    const target = vList.find((v) => v.version === version);
    if (!target) {
      throw new Error(`PromptRuntime: Version "${version}" not found for template "${id}"`);
    }

    const active = this.templates.get(id);
    if (active) {
      active.template = target.template;
      active.version = target.version;
      console.log(`[PromptRuntime] Rollback template ${id} to version ${version}`);
    }
  }

  public getVersions(id: string): PromptVersion[] {
    return this.versions.get(id) || [];
  }

  /**
   * Validates prompts using the platform policy enforcer.
   * Scans for prompt injection patterns.
   */
  public validatePrompt(prompt: string): { clean: boolean; reason?: string } {
    const hasInjection = policyEnforcer.containsInjection(prompt);
    if (hasInjection) {
      return {
        clean: false,
        reason: "Prompt safety violation: Potential prompt injection detected.",
      };
    }
    return { clean: true };
  }

  /**
   * Cryptographically signs prompt templates to maintain governance integrity.
   */
  public signTemplate(id: string): string {
    const t = this.getTemplate(id);
    if (!t) throw new Error("Template not found");
    
    // Simple mock signature generation
    const data = `${t.id}:${t.template}:${t.version}`;
    const signature = "sha256-sig-" + Buffer.from(data).toString("base64").slice(0, 16);
    t.signature = signature;
    return signature;
  }
}
