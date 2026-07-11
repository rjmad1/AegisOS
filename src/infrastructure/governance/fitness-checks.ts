import * as fs from "fs";
import * as path from "path";

export interface FitnessReport {
  timestamp: string;
  violationsFound: number;
  results: {
    rule: string;
    passed: boolean;
    details?: string[];
  }[];
}

export class FitnessChecker {
  private static instance: FitnessChecker | null = null;

  private constructor() {}

  public static getInstance(): FitnessChecker {
    if (!FitnessChecker.instance) {
      FitnessChecker.instance = new FitnessChecker();
    }
    return FitnessChecker.instance;
  }

  // ponytail: static scanner checking import borders using standard regex
  public runChecks(): FitnessReport {
    const results: FitnessReport["results"] = [];
    let violations = 0;

    // Rule 1: No direct imports of private infrastructure inside the frontend APP views (C4 compliance)
    const viewFolder = path.resolve(process.cwd(), "src", "app");
    const viewViolations: string[] = [];

    const scanImports = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of files) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanImports(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, "utf-8");
          const lines = content.split("\n");
          lines.forEach((line, idx) => {
            // Check for forbidden deep infrastructure imports (e.g. bypass of SDK layer)
            if (line.includes("from \"@/infrastructure/") && !line.includes("from \"@/infrastructure/sdk/platform-sdk\"")) {
              const relFile = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
              viewViolations.push(`${relFile}:${idx + 1} - Direct infrastructure import bypasses Platform SDK facade: ${line.trim()}`);
            }
          });
        }
      }
    };

    scanImports(viewFolder);
    
    results.push({
      rule: "No direct app-to-infrastructure import bypasses (C4 alignment)",
      passed: viewViolations.length === 0,
      details: viewViolations.length > 0 ? viewViolations : undefined
    });
    violations += viewViolations.length;

    // Rule 2: Check for ModelManifest structure consistency
    const manifestPath = path.resolve(process.cwd(), "ModelManifest.json");
    let manifestPassed = true;
    const manifestDetails: string[] = [];
    
    try {
      if (fs.existsSync(manifestPath)) {
        const data = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        if (!Array.isArray(data.models)) {
          manifestPassed = false;
          manifestDetails.push("ModelManifest format missing root models array.");
        }
      } else {
        manifestPassed = false;
        manifestDetails.push("ModelManifest.json weights file missing from root directory.");
      }
    } catch (err: any) {
      manifestPassed = false;
      manifestDetails.push(`ModelManifest parse failure: ${err.message}`);
    }

    results.push({
      rule: "ModelRegistry schema conformance",
      passed: manifestPassed,
      details: manifestDetails.length > 0 ? manifestDetails : undefined
    });
    if (!manifestPassed) violations++;

    return {
      timestamp: new Date().toISOString(),
      violationsFound: violations,
      results
    };
  }
}

export const fitnessChecker = FitnessChecker.getInstance();
export default fitnessChecker;
