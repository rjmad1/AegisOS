import * as fs from "fs";
import * as path from "path";

export interface AstSymbol {
  name: string;
  type: "class" | "interface" | "function" | "method" | "variable";
  filePath: string;
  line: number;
}

export interface DependencyLink {
  source: string;
  target: string;
  type: "import" | "inheritance" | "instantiation";
}

export class CodeGraphClient {
  private static instance: CodeGraphClient | null = null;
  private symbols: AstSymbol[] = [];
  private dependencies: DependencyLink[] = [];

  private constructor() {
    this.indexWorkspace();
  }

  public static getInstance(): CodeGraphClient {
    if (!CodeGraphClient.instance) {
      CodeGraphClient.instance = new CodeGraphClient();
    }
    return CodeGraphClient.instance;
  }

  // ponytail: AST workspace scanner using standard library filesystem tools
  public indexWorkspace() {
    const srcDir = path.resolve(process.cwd(), "src");
    this.symbols = [];
    this.dependencies = [];

    if (!fs.existsSync(srcDir)) return;

    const scan = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");

        if (entry.isDirectory()) {
          if (!["node_modules", ".next", "dist", "cache"].includes(entry.name)) {
            scan(fullPath);
          }
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          this.parseFile(fullPath, relPath);
        }
      }
    };

    scan(srcDir);
    console.log(`[CodeGraph] Indexed AST: ${this.symbols.length} symbols, ${this.dependencies.length} import dependencies discovered.`);
  }

  private parseFile(filePath: string, relativePath: string) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      // Simple regex parser for classes, interfaces, and functions
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;

        // 1. Match imports to build dependency graphs
        const importMatch = line.match(/import\s+.*\s+from\s+["'](.*)["']/);
        if (importMatch) {
          let importTarget = importMatch[1];
          // Resolve alias imports e.g. @/components/...
          if (importTarget.startsWith("@/")) {
            importTarget = importTarget.replace("@/", "src/");
          }
          this.dependencies.push({
            source: relativePath,
            target: importTarget,
            type: "import"
          });
        }

        // 2. Match classes
        const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
        if (classMatch) {
          this.symbols.push({
            name: classMatch[1],
            type: "class",
            filePath: relativePath,
            line: lineNum
          });
        }

        // 3. Match interfaces
        const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/);
        if (interfaceMatch) {
          this.symbols.push({
            name: interfaceMatch[1],
            type: "interface",
            filePath: relativePath,
            line: lineNum
          });
        }

        // 4. Match functions
        const functionMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
        if (functionMatch) {
          this.symbols.push({
            name: functionMatch[1],
            type: "function",
            filePath: relativePath,
            line: lineNum
          });
        }
      });
    } catch (err) {
      console.error(`[CodeGraph] Error parsing file ${relativePath}:`, err);
    }
  }

  public getSymbols(): AstSymbol[] {
    return this.symbols;
  }

  public getDependencies(): DependencyLink[] {
    return this.dependencies;
  }

  public querySymbol(query: string): AstSymbol[] {
    const term = query.toLowerCase();
    return this.symbols.filter((s) => s.name.toLowerCase().includes(term));
  }

  public getFileDependencies(filePath: string): DependencyLink[] {
    const normPath = filePath.replace(/\\/g, "/");
    return this.dependencies.filter((d) => d.source === normPath || d.target.includes(normPath));
  }
}

export const codeGraphClient = CodeGraphClient.getInstance();
export default codeGraphClient;
