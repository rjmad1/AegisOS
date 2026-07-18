// src/app/api/v1/ox/project-onboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET(request: NextRequest) {
  try {
    const rootPath = process.cwd();
    
    // 1. Parse package.json
    let projectName = "AegisOS Operator Workstation";
    let projectVersion = "0.1.0";
    let dependenciesCount = 0;
    let devDependenciesCount = 0;
    try {
      const packageJsonPath = path.join(rootPath, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        projectName = pkg.name || projectName;
        projectVersion = pkg.version || projectVersion;
        dependenciesCount = Object.keys(pkg.dependencies || {}).length;
        devDependenciesCount = Object.keys(pkg.devDependencies || {}).length;
      }
    } catch {}

    // 2. Read ARCHITECTURE.md
    let archSummary = "No Architecture documentation found. Please create ARCHITECTURE.md.";
    try {
      const archPath = path.join(rootPath, "ARCHITECTURE.md");
      if (fs.existsSync(archPath)) {
        archSummary = fs.readFileSync(archPath, "utf-8").substring(0, 1500) + "...";
      }
    } catch {}

    // 3. Scan ADR folder
    let adrs: string[] = [];
    try {
      const adrDir = path.join(rootPath, "adr");
      if (fs.existsSync(adrDir)) {
        adrs = fs.readdirSync(adrDir).filter(f => f.endsWith(".md"));
      }
    } catch {}

    // 4. Scan for TODOs and Tech Debt in src
    let todoCount = 0;
    const foundTodos: { file: string; line: number; text: string }[] = [];
    
    const scanDirForTodos = (dir: string) => {
      if (todoCount > 30) return; // Cap scans for performance
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (["node_modules", ".git", ".next", "databases", "artifacts_storage"].includes(file)) continue;
            scanDirForTodos(fullPath);
          } else if (stat.isFile() && /\.(ts|tsx|js|jsx|json|md)$/.test(file)) {
            const content = fs.readFileSync(fullPath, "utf-8");
            const lines = content.split("\n");
            lines.forEach((line, idx) => {
              if (line.includes("TODO") || line.includes("FIXME") || line.includes("ponytail:")) {
                todoCount++;
                if (foundTodos.length < 10) {
                  foundTodos.push({
                    file: path.relative(rootPath, fullPath).replace(/\\/g, "/"),
                    line: idx + 1,
                    text: line.trim()
                  });
                }
              }
            });
          }
        }
      } catch {}
    };

    scanDirForTodos(rootPath);

    // 5. Build Learning Path & Recommendations
    const learningPath = [
      { step: 1, name: "Deploy Platform Stack", desc: "Start Ollama, LiteLLM, and AegisOS core services via the Startup Orchestrator." },
      { step: 2, name: "Configure API Credentials", desc: "Insert your GITHUB_TOKEN or GEMINI_API_KEY in the environment setup vault." },
      { step: 3, name: "Build Embeddings", desc: "Trigger RAG database indexing for the project documents to populate semantic context." },
      { step: 4, name: "Launch Your First Agent Mission", desc: "Select a workflow playbook and execute a zero-trust automated audit pipeline." }
    ];

    const recommendedActions = [
      "Review missing environment variables in Installation Doctor",
      "Pull required Gemma 2 model weights in local Ollama daemon",
      "Optimize SQLite database indexes under VRAM recommendations"
    ];

    return NextResponse.json({
      success: true,
      onboarding: {
        name: projectName,
        version: projectVersion,
        archSummary,
        adrsCount: adrs.length,
        adrsList: adrs.slice(0, 5),
        dependenciesCount,
        devDependenciesCount,
        todoCount,
        todoList: foundTodos,
        learningPath,
        recommendedActions,
        knownIssues: [
          "LiteLLM service memory pressure detected on long-uptime host shells",
          "Ollama inference slow swapping when gemma and qwen weights are co-allocated"
        ],
        currentBlockers: missingKeysFromEnv(rootPath).length > 0
          ? ["API Keys configuration is incomplete. Authentication Doctor flags missing credentials."]
          : []
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function missingKeysFromEnv(rootPath: string): string[] {
  try {
    const envPath = path.join(rootPath, ".env");
    if (!fs.existsSync(envPath)) return ["ALL"];
    const envExamplePath = path.join(rootPath, ".env.example");
    if (!fs.existsSync(envExamplePath)) return [];
    
    const env = fs.readFileSync(envPath, "utf-8");
    const example = fs.readFileSync(envExamplePath, "utf-8");
    
    const keys = (txt: string) => {
      const list: string[] = [];
      txt.split("\n").forEach(line => {
        if (line.trim() && !line.trim().startsWith("#") && line.includes("=")) {
          list.push(line.split("=")[0].trim());
        }
      });
      return list;
    };
    
    const active = keys(env);
    const required = keys(example);
    return required.filter(k => !active.includes(k));
  } catch {
    return [];
  }
}
