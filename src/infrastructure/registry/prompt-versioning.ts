import * as fs from "fs";
import * as path from "path";

export interface PromptVersion {
  version: number;
  content: string;
  timestamp: string;
  author: string;
  changeDescription: string;
  commitHash?: string;
}

export interface PromptTemplate {
  name: string;
  purpose: string;
  activeVersion: number;
  versions: PromptVersion[];
}

export class PromptVersioning {
  private static instance: PromptVersioning | null = null;
  private promptsDir: string;
  private ledgerPath: string;
  private templates: Map<string, PromptTemplate> = new Map();

  private constructor() {
    this.promptsDir = path.resolve(process.cwd(), "configs", "prompts");
    this.ledgerPath = path.join(this.promptsDir, "versions.json");
    this.initializeDirectories();
    this.loadLedger();
    this.seedDefaultTemplates();
  }

  public static getInstance(): PromptVersioning {
    if (!PromptVersioning.instance) {
      PromptVersioning.instance = new PromptVersioning();
    }
    return PromptVersioning.instance;
  }

  private initializeDirectories() {
    if (!fs.existsSync(this.promptsDir)) {
      fs.mkdirSync(this.promptsDir, { recursive: true });
    }
  }

  private loadLedger() {
    try {
      if (fs.existsSync(this.ledgerPath)) {
        const raw = fs.readFileSync(this.ledgerPath, "utf-8");
        const list = JSON.parse(raw) as PromptTemplate[];
        list.forEach((t) => this.templates.set(t.name, t));
      }
    } catch (err) {
      console.error("[PromptVersioning] Failed to load ledger:", err);
    }
  }

  private saveLedger() {
    try {
      const list = Array.from(this.templates.values());
      fs.writeFileSync(this.ledgerPath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("[PromptVersioning] Failed to save ledger:", err);
    }
  }

  private seedDefaultTemplates() {
    const catalogPath = path.resolve(process.cwd(), "automation", "catalogs", "prompts.json");
    if (!fs.existsSync(catalogPath)) return;

    try {
      const raw = fs.readFileSync(catalogPath, "utf-8");
      const catalog = JSON.parse(raw);

      for (const item of catalog) {
        if (!this.templates.has(item.name)) {
          const defaultVersion: PromptVersion = {
            version: 1,
            content: item.template,
            timestamp: new Date().toISOString(),
            author: "System Platform Admin",
            changeDescription: "Initial seed prompt template from catalogs",
            commitHash: "init-seed-001"
          };

          const newTemplate: PromptTemplate = {
            name: item.name,
            purpose: item.purpose,
            activeVersion: 1,
            versions: [defaultVersion]
          };

          this.templates.set(item.name, newTemplate);
          this.writePromptFile(item.name, item.template);
        }
      }
      this.saveLedger();
    } catch (err) {
      console.error("[PromptVersioning] Error seeding default templates:", err);
    }
  }

  private writePromptFile(name: string, content: string) {
    const targetFolder = path.join(this.promptsDir, name);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    fs.writeFileSync(path.join(targetFolder, "prompt.txt"), content, "utf-8");
  }

  public getPrompt(name: string, versionNum?: number): string | null {
    const template = this.templates.get(name);
    if (!template) return null;

    const targetVersion = versionNum !== undefined ? versionNum : template.activeVersion;
    const versionRecord = template.versions.find((v) => v.version === targetVersion);
    return versionRecord ? versionRecord.content : null;
  }

  public savePromptVersion(
    name: string,
    content: string,
    author: string,
    changeDescription: string,
    purpose: string = "Updated prompt behavior"
  ): PromptVersion | null {
    let template = this.templates.get(name);

    if (!template) {
      template = {
        name,
        purpose,
        activeVersion: 0,
        versions: []
      };
    }

    const nextVerNum = template.versions.length + 1;
    const newVersion: PromptVersion = {
      version: nextVerNum,
      content,
      timestamp: new Date().toISOString(),
      author,
      changeDescription,
      commitHash: "local-" + crypto.randomUUID().slice(0, 7)
    };

    template.versions.push(newVersion);
    template.activeVersion = nextVerNum;
    this.templates.set(name, template);

    // Save prompt file
    this.writePromptFile(name, content);
    this.saveLedger();

    console.log(`[PromptVersioning] Saved prompt "${name}" version ${nextVerNum}`);
    return newVersion;
  }

  public rollbackTo(name: string, versionNum: number): boolean {
    const template = this.templates.get(name);
    if (!template) return false;

    const versionRecord = template.versions.find((v) => v.version === versionNum);
    if (!versionRecord) return false;

    template.activeVersion = versionNum;
    this.writePromptFile(name, versionRecord.content);
    this.saveLedger();

    console.log(`[PromptVersioning] Rolled back prompt "${name}" to version ${versionNum}`);
    return true;
  }

  public listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }
}

import * as crypto from "crypto";

export const promptVersioning = PromptVersioning.getInstance();
export default promptVersioning;
