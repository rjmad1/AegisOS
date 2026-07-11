import * as fs from "fs";
import * as path from "path";

export interface EvalTestCase {
  id: string;
  prompt: string;
  expectedKeywords: string[];
}

export interface EvalResult {
  testCaseId: string;
  modelName: string;
  response: string;
  scores: {
    correctness: number; // 0 to 100
    formatAdherence: number; // 0 to 100
    semanticMatch: number; // 0 to 100
  };
  latencyMs: number;
  tokensUsed: number;
  timestamp: string;
}

export class EvaluationPipeline {
  private static instance: EvaluationPipeline | null = null;
  private historyPath: string;
  private evalHistory: EvalResult[] = [];
  private testSuite: EvalTestCase[] = [
    {
      id: "tc-001",
      prompt: "Translate 'System validation check complete' to French in one word.",
      expectedKeywords: ["validation", "complet"]
    },
    {
      id: "tc-002",
      prompt: "Write a typescript interface for a generic cache provider.",
      expectedKeywords: ["interface", "get", "set", "Promise"]
    }
  ];

  private constructor() {
    const dbDir = process.env.OPS_DATABASES_DIR || path.resolve(process.cwd(), "databases");
    this.historyPath = path.resolve(dbDir, "evaluations.json");
    this.ensureDatabaseDir();
    this.loadHistory();
  }

  public static getInstance(): EvaluationPipeline {
    if (!EvaluationPipeline.instance) {
      EvaluationPipeline.instance = new EvaluationPipeline();
    }
    return EvaluationPipeline.instance;
  }

  private ensureDatabaseDir() {
    const dir = path.dirname(this.historyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadHistory() {
    try {
      if (fs.existsSync(this.historyPath)) {
        const raw = fs.readFileSync(this.historyPath, "utf-8");
        this.evalHistory = JSON.parse(raw) as EvalResult[];
      }
    } catch (err) {
      console.error("[EvaluationPipeline] Failed to load history:", err);
    }
  }

  private saveHistory() {
    try {
      fs.writeFileSync(this.historyPath, JSON.stringify(this.evalHistory, null, 2), "utf-8");
    } catch (err) {
      console.error("[EvaluationPipeline] Failed to save history:", err);
    }
  }

  public getTestSuite(): EvalTestCase[] {
    return this.testSuite;
  }

  public async runEvaluation(modelName: string): Promise<EvalResult[]> {
    console.log(`[EvaluationPipeline] Initiating regression suite on model: ${modelName}`);
    const results: EvalResult[] = [];

    for (const tc of this.testSuite) {
      // Simulate inference latency and scoring
      const latencyMs = Math.floor(Math.random() * 800) + 400;
      const tokensUsed = Math.floor(Math.random() * 120) + 40;
      
      let mockResponse = "";
      let correctness = 90;
      
      if (tc.id === "tc-001") {
        mockResponse = "Validation";
        correctness = 98;
      } else {
        mockResponse = "export interface ICacheProvider<T> {\n  get(key: string): Promise<T | null>;\n  set(key: string, value: T, ttlMs?: number): Promise<void>;\n}";
        correctness = 95;
      }

      const res: EvalResult = {
        testCaseId: tc.id,
        modelName,
        response: mockResponse,
        scores: {
          correctness,
          formatAdherence: 95,
          semanticMatch: 92
        },
        latencyMs,
        tokensUsed,
        timestamp: new Date().toISOString()
      };

      results.push(res);
      this.evalHistory.push(res);
    }

    this.saveHistory();
    return results;
  }

  public getHistory(modelName?: string): EvalResult[] {
    if (modelName) {
      return this.evalHistory.filter((r) => r.modelName === modelName);
    }
    return this.evalHistory;
  }
}

export const evaluationPipeline = EvaluationPipeline.getInstance();
export default evaluationPipeline;
