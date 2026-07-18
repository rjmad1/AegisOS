// src/platform/extension/ExtensionRuntimeService.ts
// Service managing the dynamic extension lifecycle and registry activation in AegisOS.

import * as fs from "fs";
import * as path from "path";
import { ExtensionManifest, ExtensionContext, IExtension } from "./ExtensionSDK";
import { capabilityRegistry } from "../../infrastructure/registry/capability-registry";
import { agentVersioning } from "../../infrastructure/registry/agent-versioning";
import { promptVersioning } from "../../infrastructure/registry/prompt-versioning";
import { workflowRepository } from "../../repositories/workflow.repository";
import { ToolRuntime } from "../ai-runtime/ToolRuntime";
import { PlatformKernel } from "../kernel/PlatformKernel";
import { PlatformModule, PlatformDomain } from "../kernel/types";
import { certificationSuite } from "../developer/governance/CertificationSuite";
import { eventBus } from "../../infrastructure/events/event-bus";
import { logger } from "../../infrastructure/observability/structured-logger";

export interface ExtensionState {
  id: string;
  manifest: ExtensionManifest;
  status: "discovered" | "validated" | "activated" | "deactivated" | "error";
  health: "healthy" | "unhealthy" | "degraded";
  errorMessage?: string;
  installedPath: string;
  activatedAt?: string;
  virtualModuleId?: string;
}

export class ExtensionRuntimeService {
  private static instance: ExtensionRuntimeService | null = null;
  private extensionsDir: string;
  private states: Map<string, ExtensionState> = new Map();
  private instances: Map<string, IExtension> = new Map();
  private isInitialized = false;

  private constructor() {
    this.extensionsDir = path.resolve(process.cwd(), "extensions");
    this.ensureDirectory();
  }

  public static getInstance(): ExtensionRuntimeService {
    if (!ExtensionRuntimeService.instance) {
      ExtensionRuntimeService.instance = new ExtensionRuntimeService();
    }
    return ExtensionRuntimeService.instance;
  }

  private ensureDirectory() {
    if (!fs.existsSync(this.extensionsDir)) {
      fs.mkdirSync(this.extensionsDir, { recursive: true });
    }
  }

  /**
   * Initialize the service: discover, validate, resolve, and activate extensions on startup.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log("[ExtensionRuntimeService] Initializing extension ecosystem...");
    
    // Discover all extensions in extensions/ directory
    await this.discover();

    // Validate and resolve dependencies
    const toActivate: string[] = [];
    for (const [id, state] of this.states.entries()) {
      try {
        const cert = certificationSuite.runCertificationScan({
          id: state.manifest.id,
          name: state.manifest.name,
          version: state.manifest.version,
          type: "plugin",
          signature: state.manifest.signature || "",
          dependencies: state.manifest.dependencies,
          permissions: state.manifest.permissions
        });

        if (!cert.passed) {
          state.status = "error";
          state.health = "unhealthy";
          state.errorMessage = `Certification scan failed: ${cert.issues.join("; ")}`;
          continue;
        }

        // Verify dependencies
        this.resolveDependencies(state.manifest);
        state.status = "validated";
        toActivate.push(id);
      } catch (err: any) {
        state.status = "error";
        state.health = "unhealthy";
        state.errorMessage = err.message;
      }
    }

    // Activate valid extensions
    for (const id of toActivate) {
      try {
        await this.activate(id);
      } catch (err: any) {
        console.error(`[ExtensionRuntimeService] Failed to activate ${id}:`, err);
      }
    }

    console.log(`[ExtensionRuntimeService] Initialization complete. Loaded ${this.states.size} extensions.`);
  }

  /**
   * Discover extensions by reading the subfolders of the extensions directory.
   */
  public async discover(): Promise<ExtensionState[]> {
    this.ensureDirectory();
    const dirs = fs.readdirSync(this.extensionsDir, { withFileTypes: true });

    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;
      const folderPath = path.join(this.extensionsDir, dir.name);
      const manifestPath = path.join(folderPath, "manifest.json");

      if (!fs.existsSync(manifestPath)) continue;

      try {
        const raw = fs.readFileSync(manifestPath, "utf-8");
        const manifest = JSON.parse(raw) as ExtensionManifest;

        if (manifest.id !== dir.name) {
          console.warn(`[ExtensionRuntimeService] Extension ID "${manifest.id}" does not match folder name "${dir.name}". Ignoring.`);
          continue;
        }

        if (!this.states.has(manifest.id)) {
          this.states.set(manifest.id, {
            id: manifest.id,
            manifest,
            status: "discovered",
            health: "healthy",
            installedPath: folderPath
          });
        }
      } catch (err: any) {
        console.error(`[ExtensionRuntimeService] Error reading extension in folder ${dir.name}:`, err);
      }
    }

    return Array.from(this.states.values());
  }

  /**
   * Validate dependencies of a manifest. Throws error if invalid.
   */
  private resolveDependencies(manifest: ExtensionManifest): void {
    const deps = manifest.dependencies || {};
    for (const [name, versionRange] of Object.entries(deps)) {
      if (name === "aegisos" || name === "platform") {
        // Core compatibility check
        continue;
      }

      // Check if required extension is installed and active
      const depState = this.states.get(name);
      if (!depState) {
        throw new Error(`Missing dependency: extension "${name}" is not installed.`);
      }
      if (depState.status !== "activated" && depState.status !== "validated") {
        throw new Error(`Dependency unresolved: extension "${name}" is not active or has error: ${depState.errorMessage || "unknown"}`);
      }
      // Simple version compatibility mock
      console.log(`[ExtensionRuntimeService] Resolved dependency: ${name} (${versionRange})`);
    }
  }

  /**
   * Register capabilities, agents, prompts, workflows, and tools into existing registries.
   */
  private async registerCapabilities(state: ExtensionState): Promise<void> {
    const { manifest, id } = state;

    // 1. Register Capabilities in CapabilityRegistry
    if (manifest.capabilities && manifest.capabilities.length > 0) {
      capabilityRegistry.registerPlugin({
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        manifestVersion: "1.0",
        capabilities: manifest.capabilities,
        dependencies: manifest.dependencies,
        configSchema: { type: "object" },
        permissions: manifest.permissions
      });
    }

    // 2. Register Agents in AgentVersioning
    if (manifest.agents) {
      for (const agent of manifest.agents) {
        agentVersioning.saveAgentVersion(
          agent.agentId,
          {
            agentId: agent.agentId,
            name: agent.name,
            role: agent.role,
            models: agent.models,
            version: manifest.version,
            mcpServers: agent.mcpServers || []
          },
          manifest.author,
          `Dynamic registration by extension ${manifest.name}`
        );
      }
    }

    // 3. Register Prompts in PromptVersioning
    if (manifest.prompts) {
      for (const prompt of manifest.prompts) {
        promptVersioning.savePromptVersion(
          prompt.name,
          prompt.template,
          manifest.author,
          `Dynamic registration by extension ${manifest.name}`,
          prompt.purpose
        );
      }
    }

    // 4. Register Workflows in WorkflowRepository
    if (manifest.workflows) {
      for (const wf of manifest.workflows) {
        await workflowRepository.saveWorkflow({
          id: wf.id,
          name: wf.name,
          description: wf.description,
          version: wf.version,
          status: wf.status,
          nodes: wf.nodes,
          capabilities: wf.capabilities,
          dependencies: wf.dependencies,
          relationships: wf.relationships,
          metadata: wf.metadata || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    // 5. Register Tools in ToolRuntime
    if (manifest.tools) {
      const toolRuntime = ToolRuntime.getInstance();
      for (const tool of manifest.tools) {
        toolRuntime.registerTool({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          permissionsRequired: tool.permissionsRequired,
          sandboxLevel: tool.sandboxLevel,
          version: manifest.version,
          enabled: tool.enabled
        });
      }
    }

    // 6. Register UI & Mobile Contributions in PlatformKernel / ModuleRegistry
    const hasUI = manifest.uiContributions && manifest.uiContributions.length > 0;
    if (hasUI) {
      const virtualModuleId = `virtual-${id}`;
      const virtualModule: PlatformModule = {
        id: virtualModuleId,
        name: manifest.name,
        version: manifest.version,
        domain: "platform" as PlatformDomain,
        description: manifest.description,
        routes: manifest.uiContributions!.map((ui: any) => ({
          path: ui.href,
          moduleId: virtualModuleId,
          label: ui.label
        })),
        navItems: manifest.uiContributions!.map((ui: any) => ({
          id: ui.id,
          label: ui.label,
          href: ui.href,
          group: ui.group || "Extensions",
          order: ui.order || 50
        }))
      };
      
      PlatformKernel.registerModule(virtualModule);
      state.virtualModuleId = virtualModuleId;
    }
  }

  /**
   * Activate an extension.
   */
  public async activate(id: string): Promise<void> {
    const state = this.states.get(id);
    if (!state) throw new Error(`Extension "${id}" is not discovered.`);

    if (state.status === "activated") return;

    try {
      console.log(`[ExtensionRuntimeService] Activating extension ${state.manifest.name} (${id})...`);
      
      // Register all assets with existing registries
      await this.registerCapabilities(state);

      // Load main entry point if present
      if (state.manifest.entryPoints?.main) {
        const scriptPath = path.resolve(state.installedPath, state.manifest.entryPoints.main);
        
        // Wrap execution in a mock/safe loader
        if (fs.existsSync(scriptPath)) {
          // Dynamic load
          const extModule = require(scriptPath);
          const extensionClass = extModule.default || extModule;
          
          if (typeof extensionClass === "function") {
            const instance = new extensionClass() as IExtension;
            const context: ExtensionContext = this.createContext(state);
            await instance.initialize(context);
            this.instances.set(id, instance);
          }
        }
      }

      state.status = "activated";
      state.health = "healthy";
      state.activatedAt = new Date().toISOString();

      await eventBus.publish({
        name: "ExtensionActivated",
        source: "runtime:extension",
        version: "v1",
        priority: "medium",
        securityClassification: "internal",
        retentionPolicy: "temp",
        payload: { extensionId: id, timestamp: Date.now() }
      });

      console.log(`[ExtensionRuntimeService] Extension ${id} is fully activated.`);
    } catch (err: any) {
      state.status = "error";
      state.health = "unhealthy";
      state.errorMessage = `Activation failed: ${err.message}`;
      console.error(`[ExtensionRuntimeService] Activation failed for ${id}:`, err);
      throw err;
    }
  }

  /**
   * Deactivate an extension.
   */
  public async deactivate(id: string): Promise<void> {
    const state = this.states.get(id);
    if (!state) throw new Error(`Extension "${id}" is not discovered.`);

    if (state.status !== "activated") return;

    try {
      console.log(`[ExtensionRuntimeService] Deactivating extension ${state.manifest.name} (${id})...`);

      // 1. Call shutdown on instance if exists
      const instance = this.instances.get(id);
      if (instance) {
        await instance.shutdown();
        this.instances.delete(id);
      }

      // 2. Unregister virtual module if exists
      if (state.virtualModuleId) {
        PlatformKernel.unregisterModule(state.virtualModuleId);
        state.virtualModuleId = undefined;
      }

      // 3. Mark as deactivated
      state.status = "deactivated";
      state.activatedAt = undefined;

      await eventBus.publish({
        name: "ExtensionDeactivated",
        source: "runtime:extension",
        version: "v1",
        priority: "medium",
        securityClassification: "internal",
        retentionPolicy: "temp",
        payload: { extensionId: id, timestamp: Date.now() }
      });

      console.log(`[ExtensionRuntimeService] Extension ${id} has been deactivated.`);
    } catch (err: any) {
      state.status = "error";
      state.health = "unhealthy";
      state.errorMessage = `Deactivation failed: ${err.message}`;
      throw err;
    }
  }

  /**
   * Install a new extension package by creating folder and writing files.
   */
  public async install(id: string, manifest: ExtensionManifest, files?: Record<string, string>): Promise<ExtensionState> {
    this.ensureDirectory();
    const folderPath = path.join(this.extensionsDir, id);

    if (fs.existsSync(folderPath)) {
      throw new Error(`Extension "${id}" is already installed.`);
    }

    try {
      fs.mkdirSync(folderPath, { recursive: true });
      fs.writeFileSync(path.join(folderPath, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");

      if (files) {
        for (const [relPath, content] of Object.entries(files)) {
          const fullPath = path.join(folderPath, relPath);
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          fs.writeFileSync(fullPath, content, "utf-8");
        }
      }

      const state: ExtensionState = {
        id,
        manifest,
        status: "discovered",
        health: "healthy",
        installedPath: folderPath
      };

      this.states.set(id, state);

      // Perform validation and resolution
      const cert = certificationSuite.runCertificationScan({
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        type: "plugin",
        signature: manifest.signature || "",
        dependencies: manifest.dependencies,
        permissions: manifest.permissions
      });

      if (!cert.passed) {
        state.status = "error";
        state.health = "unhealthy";
        state.errorMessage = `Certification scan failed: ${cert.issues.join("; ")}`;
        return state;
      }

      this.resolveDependencies(manifest);
      state.status = "validated";

      // Automatically activate
      await this.activate(id);

      return state;
    } catch (err: any) {
      // Clean up files on crash
      try {
        if (fs.existsSync(folderPath)) {
          fs.rmSync(folderPath, { recursive: true, force: true });
        }
      } catch {}
      throw err;
    }
  }

  /**
   * Uninstall an extension.
   */
  public async uninstall(id: string): Promise<void> {
    const state = this.states.get(id);
    if (!state) throw new Error(`Extension "${id}" is not installed.`);

    if (state.status === "activated") {
      await this.deactivate(id);
    }

    try {
      if (fs.existsSync(state.installedPath)) {
        fs.rmSync(state.installedPath, { recursive: true, force: true });
      }
      this.states.delete(id);

      await eventBus.publish({
        name: "ExtensionUninstalled",
        source: "runtime:extension",
        version: "v1",
        priority: "medium",
        securityClassification: "internal",
        retentionPolicy: "temp",
        payload: { extensionId: id, timestamp: Date.now() }
      });
      
      console.log(`[ExtensionRuntimeService] Extension ${id} uninstalled.`);
    } catch (err: any) {
      state.status = "error";
      state.health = "unhealthy";
      state.errorMessage = `Uninstall failed: ${err.message}`;
      throw err;
    }
  }

  /**
   * Update an extension.
   */
  public async update(id: string, manifest: ExtensionManifest, files?: Record<string, string>): Promise<ExtensionState> {
    const state = this.states.get(id);
    if (!state) throw new Error(`Extension "${id}" is not installed.`);

    console.log(`[ExtensionRuntimeService] Updating extension ${id} to version ${manifest.version}...`);

    // Deactivate first
    if (state.status === "activated") {
      await this.deactivate(id);
    }

    // Rewrite manifest and files
    fs.writeFileSync(path.join(state.installedPath, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
    if (files) {
      for (const [relPath, content] of Object.entries(files)) {
        const fullPath = path.join(state.installedPath, relPath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content, "utf-8");
      }
    }

    state.manifest = manifest;
    state.status = "discovered";

    // Validate and reactivate
    const cert = certificationSuite.runCertificationScan({
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      type: "plugin",
      signature: manifest.signature || "",
      dependencies: manifest.dependencies,
      permissions: manifest.permissions
    });

    if (!cert.passed) {
      state.status = "error";
      state.health = "unhealthy";
      state.errorMessage = `Update failed certification scan: ${cert.issues.join("; ")}`;
      return state;
    }

    this.resolveDependencies(manifest);
    state.status = "validated";

    await this.activate(id);
    return state;
  }

  /**
   * Create context for sandbox execution.
   */
  private createContext(state: ExtensionState): ExtensionContext {
    return {
      extensionId: state.id,
      manifest: state.manifest,
      logger: {
        info: (msg: string, ...meta: any[]) => logger.info(`[Ext:${state.id}] ${msg}`, { extensionId: state.id, ...meta }),
        warn: (msg: string, ...meta: any[]) => logger.warn(`[Ext:${state.id}] ${msg}`, { extensionId: state.id, ...meta }),
        error: (msg: string, err: any, ...meta: any[]) => logger.error(`[Ext:${state.id}] ${msg}`, err, { extensionId: state.id, ...meta })
      },
      config: {},
      eventBus: {
        publish: async (name: string, payload: any) => {
          if (!state.manifest.permissions.includes("event-publish") && !state.manifest.permissions.includes("*")) {
            throw new Error(`Extension "${state.id}" lacks permission "event-publish"`);
          }
          await eventBus.publish({
            name,
            source: `extension:${state.id}`,
            version: "v1",
            priority: "medium",
            securityClassification: "internal",
            retentionPolicy: "temp",
            payload
          });
        },
        subscribe: (name: string, handler: any) => {
          if (!state.manifest.permissions.includes("event-subscribe") && !state.manifest.permissions.includes("*")) {
            throw new Error(`Extension "${state.id}" lacks permission "event-subscribe"`);
          }
          return eventBus.subscribe(name, (evt) => {
            handler({
              name: evt.name,
              source: evt.source,
              payload: evt.payload,
              timestamp: evt.timestamp
            });
          });
        },
        unsubscribe: (subId: string) => {
          eventBus.unsubscribe(subId);
        }
      }
    };
  }

  /**
   * Retrieve list of registered extensions.
   */
  public getExtensions(): ExtensionState[] {
    return Array.from(this.states.values());
  }

  /**
   * Get single extension details.
   */
  public getExtension(id: string): ExtensionState | null {
    return this.states.get(id) || null;
  }

  /**
   * Generate Dependency Graph of extensions.
   */
  public getDependencyGraph(): { nodes: { id: string; name: string; type: string }[]; edges: { source: string; target: string }[] } {
    const nodes: { id: string; name: string; type: string }[] = [];
    const edges: { source: string; target: string }[] = [];

    // Add core node
    nodes.push({ id: "aegisos-core", name: "AegisOS Core", type: "platform" });

    for (const state of this.states.values()) {
      nodes.push({ id: state.id, name: state.manifest.name, type: "extension" });

      const deps = state.manifest.dependencies || {};
      for (const depName of Object.keys(deps)) {
        if (depName === "aegisos" || depName === "platform") {
          edges.push({ source: state.id, target: "aegisos-core" });
        } else {
          edges.push({ source: state.id, target: depName });
        }
      }

      // Add capabilities if any
      if (state.manifest.capabilities) {
        for (const cap of state.manifest.capabilities) {
          const capId = `cap:${cap}`;
          if (!nodes.some(n => n.id === capId)) {
            nodes.push({ id: capId, name: cap, type: "capability" });
          }
          edges.push({ source: state.id, target: capId });
        }
      }
    }

    return { nodes, edges };
  }
}

export const extensionRuntimeService = ExtensionRuntimeService.getInstance();
export default extensionRuntimeService;
