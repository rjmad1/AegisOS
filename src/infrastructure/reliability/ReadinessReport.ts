import { srePlatform } from "./SREPlatform";
import { chaosPlatform } from "./ChaosPlatform";
import { riskRegister } from "./RiskRegister";
import { incidentManager } from "./IncidentManager";
import { disasterRecovery } from "./DisasterRecovery";

export interface ReliabilityReadinessReportData {
  timestamp: string;
  readinessScore: number; // 0 to 100
  sreMetrics: {
    sloCompliancePercent: number;
    slaCompliancePercent: number;
  };
  chaosMetrics: {
    resilienceScore: number;
    completedDrills: number;
  };
  incidentsMetrics: {
    meanTimeToDetectSeconds: number;
    meanTimeToRecoverSeconds: number;
    totalIncidents: number;
  };
  disasterRecovery: {
    rpoMinutes: number;
    rtoSeconds: number;
  };
  riskSummary: {
    totalRisks: number;
    mitigatedRisks: number;
  };
}

export class ReadinessReport {
  private static instance: ReadinessReport | null = null;

  private constructor() {}

  public static getInstance(): ReadinessReport {
    if (!ReadinessReport.instance) {
      ReadinessReport.instance = new ReadinessReport();
    }
    return ReadinessReport.instance;
  }

  public getReport(): ReliabilityReadinessReportData {
    const sre = srePlatform.getSloReport();
    const resilienceScore = chaosPlatform.getResilienceScore();
    const risks = riskRegister.getRisks();
    const incidents = incidentManager.getIncidentMetrics();
    const dr = disasterRecovery.getDRStatus();

    const mitigatedRisks = risks.filter(r => r.status === "Mitigated").length;
    const drillsCount = chaosPlatform.getFaults().length;

    // Weight formulas for dynamic score
    const readinessScore = Math.round(
      (sre.overallSloCompliance * 0.3) +
      (resilienceScore * 0.3) +
      ((mitigatedRisks / risks.length) * 100 * 0.2) +
      (100 - Math.min(incidents.activeCount * 20, 100)) * 0.2
    );

    return {
      timestamp: new Date().toISOString(),
      readinessScore,
      sreMetrics: {
        sloCompliancePercent: sre.overallSloCompliance,
        slaCompliancePercent: sre.overallSlaCompliance
      },
      chaosMetrics: {
        resilienceScore,
        completedDrills: drillsCount
      },
      incidentsMetrics: {
        meanTimeToDetectSeconds: incidents.meanTimeToDetectSeconds,
        meanTimeToRecoverSeconds: incidents.meanTimeToRecoverSeconds,
        totalIncidents: incidents.totalCount
      },
      disasterRecovery: {
        rpoMinutes: dr.rpoMinutes,
        rtoSeconds: dr.rtoSeconds
      },
      riskSummary: {
        totalRisks: risks.length,
        mitigatedRisks
      }
    };
  }
}

export const readinessReport = ReadinessReport.getInstance();
export default readinessReport;
