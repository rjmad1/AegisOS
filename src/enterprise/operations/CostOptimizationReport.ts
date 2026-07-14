// src/enterprise/operations/CostOptimizationReport.ts
// Cost Optimization Report — Executive FinOps audit, savings, cost category allocation

import { finOpsDashboard } from './FinOpsDashboard';
import { costOptimizationPlatform } from '../performance/CostOptimizationPlatform';

export class CostOptimizationReport {
  private static instance: CostOptimizationReport | null = null;

  private constructor() {}

  public static getInstance(): CostOptimizationReport {
    if (!CostOptimizationReport.instance) {
      CostOptimizationReport.instance = new CostOptimizationReport();
    }
    return CostOptimizationReport.instance;
  }

  public generateReport(tenantId = '__system__'): string {
    const dashboard = finOpsDashboard.getDashboardOverview(tenantId);
    const efficiency = costOptimizationPlatform.getFinOpsEfficiency(tenantId);

    const sections: string[] = [];
    sections.push(`# AegisOS FinOps & Cost Optimization Report`);
    sections.push(`Generated: ${new Date().toISOString()}`);
    sections.push(`Target Tenant: ${tenantId}`);
    sections.push(`---`);

    sections.push(`## 1. Financial Efficiency Scorecard`);
    sections.push(`- **Current Monthly Spend Baseline**: $${(efficiency.spentUsd).toFixed(2)}`);
    sections.push(`- **Projected Spend After Optimization**: $${(efficiency.optimizedSpentUsd).toFixed(2)}`);
    sections.push(`- **Net Monthly Savings Opportunity**: $${(efficiency.netSavingsUsd).toFixed(2)}`);
    sections.push(`- **Platform Waste Percentage**: **${efficiency.wastePercentage}%**`);
    sections.push(``);

    sections.push(`## 2. Spend Allocation By Category`);
    sections.push(`| Category | Current Cost (Monthly) | Savings Opportunity | Potential Savings % |`);
    sections.push(`|---|---|---|---|`);
    for (const c of dashboard.costsByCategory) {
      const pct = c.monthlyCostUsd > 0 ? ((c.savingsOpportunityUsd / c.monthlyCostUsd) * 100).toFixed(1) : '0.0';
      sections.push(`| ${c.category} | $${c.monthlyCostUsd.toFixed(2)} | $${c.savingsOpportunityUsd.toFixed(2)} | ${pct}% |`);
    }
    sections.push(``);

    sections.push(`## 3. Prioritized Cost Optimization Recommendations`);
    sections.push(`| Priority | Recommendation | Estimated Savings | Action Steps |`);
    sections.push(`|---|---|---|---|`);
    for (const r of dashboard.savingsTimelineRecommendations) {
      const badge = r.priority === 'high' ? '🔴 High' : r.priority === 'medium' ? '🟡 Medium' : '🟢 Low';
      sections.push(`| ${badge} | ${r.title} | $${r.savingsUsd.toFixed(2)} | \`${r.remediationAction}\` |`);
    }
    sections.push(``);

    sections.push(`## 4. Waste & Reserved Capacity Strategy`);
    sections.push(`1. **Fractional GPU Allocation**: Implement model multiplexing dynamically to reduce cold VRAM waste.`);
    sections.push(`2. **Context Compression**: Activate prompt caching to truncate redundant LLM system contexts.`);
    sections.push(`3. **Reserved Capacity Commits**: Shift core baseline agent workloads from dynamic tokens-on-demand APIs to reserved instance models, yielding up to 35% cost reductions.`);

    return sections.join('\n');
  }
}

export const costOptimizationReport = CostOptimizationReport.getInstance();
export default costOptimizationReport;
