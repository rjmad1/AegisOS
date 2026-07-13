export interface RiskItem {
  id: string;
  component: string;
  riskDescription: string;
  likelihood: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High" | "Critical";
  mitigationStrategy: string;
  status: "Mitigated" | "Unmitigated" | "Under Review";
}

export class RiskRegister {
  private static instance: RiskRegister | null = null;
  private risks: RiskItem[] = [];

  private constructor() {
    this.initializeRiskRegister();
  }

  public static getInstance(): RiskRegister {
    if (!RiskRegister.instance) {
      RiskRegister.instance = new RiskRegister();
    }
    return RiskRegister.instance;
  }

  private initializeRiskRegister() {
    this.risks = [
      {
        id: "risk-01",
        component: "SQLite Database",
        riskDescription: "SQLite is single-instance and lacks multi-node replication. Node loss results in data recovery delay.",
        likelihood: "Medium",
        impact: "High",
        mitigationStrategy: "Automated hourly back-up sync to secure Cloud Storage buckets and SQLite integrity check automation.",
        status: "Mitigated"
      },
      {
        id: "risk-02",
        component: "GPU Hardware",
        riskDescription: "Single local GPU bottleneck. Concurrent inference requests saturate VRAM memory capacity.",
        likelihood: "High",
        impact: "Medium",
        mitigationStrategy: "Graceful degradation policy routing queries to cloud API endpoint providers (LiteLLM) when local GPU saturation is flagged.",
        status: "Mitigated"
      },
      {
        id: "risk-03",
        component: "OTel Collector Connection",
        riskDescription: "OTel collector port 4318 failure leads to dropped spans.",
        likelihood: "Low",
        impact: "Medium",
        mitigationStrategy: "Telemetry self-observability buffer captures dropped spans and retries exporter connection.",
        status: "Mitigated"
      },
      {
        id: "risk-04",
        component: "DNS Failures",
        riskDescription: "Local DNS outages lock down external provider gateways API queries.",
        likelihood: "Low",
        impact: "Critical",
        mitigationStrategy: "Configure dual DNS server properties (e.g. 8.8.8.8 and 1.1.1.1) in host operating system configs.",
        status: "Under Review"
      }
    ];
  }

  public getRisks(): RiskItem[] {
    return this.risks;
  }
}

export const riskRegister = RiskRegister.getInstance();
export default riskRegister;
