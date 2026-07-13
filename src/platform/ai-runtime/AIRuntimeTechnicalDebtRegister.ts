export interface DebtItem {
  id: string;
  category: "architecture" | "performance" | "security" | "testing";
  title: string;
  description: string;
  remediationPath: string;
  impactScore: number; // 1 to 10
  status: "open" | "remediated";
}

export class AIRuntimeTechnicalDebtRegister {
  private static instance: AIRuntimeTechnicalDebtRegister | null = null;
  private ledger: DebtItem[] = [];

  private constructor() {
    this.seedLedger();
  }

  public static getInstance(): AIRuntimeTechnicalDebtRegister {
    if (!AIRuntimeTechnicalDebtRegister.instance) {
      AIRuntimeTechnicalDebtRegister.instance = new AIRuntimeTechnicalDebtRegister();
    }
    return AIRuntimeTechnicalDebtRegister.instance;
  }

  private seedLedger(): void {
    this.ledger = [
      {
        id: "debt:001:sandbox",
        category: "security",
        title: "Simulated Tool Sandbox Isolation",
        description: "Tool execution sandboxing is simulated using sandboxLevel descriptors. Real-world execution needs container/VM-level boundaries.",
        remediationPath: "Integrate gVisor, WebAssembly (Wasmtime), or Docker containerization for outbound tool execution.",
        impactScore: 8,
        status: "open",
      },
      {
        id: "debt:002:vector",
        category: "performance",
        title: "In-Memory Semantic Search Mock",
        description: "Knowledge and memory semantic search uses keyword and tag relevance checking. Needs a real Vector Database (pgvector / Chroma / Qdrant).",
        remediationPath: "Integrate PostgreSQL pgvector using Prisma client query builders.",
        impactScore: 7,
        status: "open",
      },
      {
        id: "debt:003:llm-network",
        category: "performance",
        title: "Mocked LLM Network Responses",
        description: "Provider runtime defaults to simulated completions to run self-contained. Needs full connection to active Ollama/LiteLLM server sockets.",
        remediationPath: "Enable direct Axios/Fetch bindings to Ollama port 11434 and LiteLLM gateway routers in production configs.",
        impactScore: 6,
        status: "open",
      },
    ];
  }

  public registerDebt(item: DebtItem): void {
    this.ledger.push(item);
  }

  public getLedger(): DebtItem[] {
    return this.ledger;
  }

  public remediate(id: string): void {
    const item = this.ledger.find((i) => i.id === id);
    if (item) {
      item.status = "remediated";
    }
  }
}
export default AIRuntimeTechnicalDebtRegister;
