import * as fs from "fs";
import * as path from "path";

export interface AgentConfiguration {
  agentId: string;
  name: string;
  role: string;
  models: string[];
  version: string;
  mcpServers?: string[];
}

export interface AgentVersionRecord {
  version: string;
  timestamp: string;
  author: string;
  changeDescription: string;
  configuration: AgentConfiguration;
}

export interface AgentProfile {
  agentId: string;
  activeVersion: string;
  versions: AgentVersionRecord[];
}

export class AgentVersioning {
  private static instance: AgentVersioning | null = null;
  private agentsDir: string;
  private ledgerPath: string;
  private agents: Map<string, AgentProfile> = new Map();

  private constructor() {
    this.agentsDir = path.resolve(process.cwd(), "configs", "agents");
    this.ledgerPath = path.join(this.agentsDir, "versions.json");
    this.initializeDirectories();
    this.loadLedger();
    this.seedDefaultAgents();
  }

  public static getInstance(): AgentVersioning {
    if (!AgentVersioning.instance) {
      AgentVersioning.instance = new AgentVersioning();
    }
    return AgentVersioning.instance;
  }

  private initializeDirectories() {
    if (!fs.existsSync(this.agentsDir)) {
      fs.mkdirSync(this.agentsDir, { recursive: true });
    }
  }

  private loadLedger() {
    try {
      if (fs.existsSync(this.ledgerPath)) {
        const raw = fs.readFileSync(this.ledgerPath, "utf-8");
        const list = JSON.parse(raw) as AgentProfile[];
        list.forEach((a) => this.agents.set(a.agentId, a));
      }
    } catch (err) {
      console.error("[AgentVersioning] Failed to load ledger:", err);
    }
  }

  private saveLedger() {
    try {
      const list = Array.from(this.agents.values());
      fs.writeFileSync(this.ledgerPath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("[AgentVersioning] Failed to save ledger:", err);
    }
  }

  private seedDefaultAgents() {
    const catalogPath = path.resolve(process.cwd(), "automation", "catalogs", "agents.json");
    if (!fs.existsSync(catalogPath)) return;

    try {
      const raw = fs.readFileSync(catalogPath, "utf-8");
      const catalog = JSON.parse(raw);

      // Maps static interface version tags
      const mcpMap: Record<string, string[]> = {
        main: ["filesystem", "git", "sqlite"],
        developer: ["filesystem", "git", "puppeteer"],
        reviewer: ["raja-knowledge-repository"]
      };
      const versionMap: Record<string, string> = {
        main: "2.1",
        developer: "1.8",
        reviewer: "1.4"
      };

      for (const item of catalog) {
        if (!this.agents.has(item.agentId)) {
          const config: AgentConfiguration = {
            agentId: item.agentId,
            name: item.name,
            role: item.role,
            models: item.models,
            version: versionMap[item.agentId] || "1.0",
            mcpServers: mcpMap[item.agentId] || []
          };

          const defaultRecord: AgentVersionRecord = {
            version: config.version,
            timestamp: new Date().toISOString(),
            author: "System Platform Admin",
            changeDescription: "Initial seed agent configuration",
            configuration: config
          };

          const newProfile: AgentProfile = {
            agentId: item.agentId,
            activeVersion: config.version,
            versions: [defaultRecord]
          };

          this.agents.set(item.agentId, newProfile);
          this.writeAgentConfigFile(item.agentId, config);
        }
      }
      this.saveLedger();
    } catch (err) {
      console.error("[AgentVersioning] Error seeding agents:", err);
    }
  }

  private writeAgentConfigFile(agentId: string, config: AgentConfiguration) {
    const targetFolder = path.join(this.agentsDir, agentId);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    fs.writeFileSync(
      path.join(targetFolder, "config.json"),
      JSON.stringify(config, null, 2),
      "utf-8"
    );
  }

  public getAgentConfig(agentId: string, versionStr?: string): AgentConfiguration | null {
    const profile = this.agents.get(agentId);
    if (!profile) return null;

    const targetVersion = versionStr !== undefined ? versionStr : profile.activeVersion;
    const record = profile.versions.find((v) => v.version === targetVersion);
    return record ? record.configuration : null;
  }

  public saveAgentVersion(
    agentId: string,
    config: AgentConfiguration,
    author: string,
    changeDescription: string
  ): AgentVersionRecord | null {
    let profile = this.agents.get(agentId);

    if (!profile) {
      profile = {
        agentId,
        activeVersion: config.version,
        versions: []
      };
    }

    const newRecord: AgentVersionRecord = {
      version: config.version,
      timestamp: new Date().toISOString(),
      author,
      changeDescription,
      configuration: config
    };

    profile.versions.push(newRecord);
    profile.activeVersion = config.version;
    this.agents.set(agentId, profile);

    this.writeAgentConfigFile(agentId, config);
    this.saveLedger();

    console.log(`[AgentVersioning] Saved agent "${agentId}" configuration version ${config.version}`);
    return newRecord;
  }

  public listAgents(): AgentProfile[] {
    return Array.from(this.agents.values());
  }
}

export const agentVersioning = AgentVersioning.getInstance();
export default agentVersioning;
