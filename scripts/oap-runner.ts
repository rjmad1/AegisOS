// scripts/oap-runner.ts

import * as fs from "fs";
import * as path from "path";
import { oapEngine } from "../src/platform/oap/oap-engine";

async function main() {
  console.log("====================================================");
  console.log("   AEGIS-OS OPERATIONAL ADOPTION PROGRAM (OAP)");
  console.log("   Operational Telemetry & Adoption Scorecard Engine");
  console.log("====================================================\n");

  const frictionItems = oapEngine.loadFrictionCatalog();
  console.log(`[OAP] Loaded Friction Catalog (${frictionItems.length} Logged Usability Issues)\n`);

  console.log("[OAP] Collecting & Aggregating Operational Telemetry Events...");
  const events = oapEngine.generateSampleTelemetryEvents();
  const scorecard = oapEngine.computeScorecard(events);

  console.log("\n====================================================");
  console.log("           OPERATIONAL SCORECARD RESULTS");
  console.log("====================================================");
  console.log(`Total Missions Executed:     ${scorecard.totalMissionsExecuted}`);
  console.log(`Passed (PASS):               ${scorecard.passedMissions}`);
  console.log(`Warnings (WARNING):           ${scorecard.warningMissions}`);
  console.log(`Failed (FAIL):               ${scorecard.failedMissions}`);
  console.log(`Mission Success Rate:        ${scorecard.overallSuccessRatePercent}%`);
  console.log(`Avg Completion Duration:     ${scorecard.avgCompletionDurationSeconds}s`);
  console.log(`HITL Interventions / Mission:${scorecard.avgHitlInterventionsPerMission}`);
  console.log(`Avg Reflection Cycles:       ${scorecard.avgReflectionCyclesPerMission}`);
  console.log(`Knowledge Reuse Rate:        ${scorecard.overallKnowledgeReusePercent}%`);
  console.log(`Avg Artifact Quality:        ${scorecard.avgArtifactQualityScore}/100`);
  console.log(`Execution Recovery Rate:     ${scorecard.executionRecoveryRatePercent}%`);
  console.log("----------------------------------------------------");
  console.log(`UX Time to Launch Mission:   ${(scorecard.uxMetricAverages.timeToLaunchMissionMs / 1000).toFixed(2)}s`);
  console.log(`UX Time to Find Artifacts:   ${(scorecard.uxMetricAverages.timeToFindArtifactsMs / 1000).toFixed(2)}s`);
  console.log(`UX Time to Locate Knowledge: ${(scorecard.uxMetricAverages.timeToLocateKnowledgeMs / 1000).toFixed(2)}s`);
  console.log(`UX Time to Approve HITL:     ${(scorecard.uxMetricAverages.timeToApproveHitlMs / 1000).toFixed(2)}s`);
  console.log("----------------------------------------------------");
  console.log(`Logged Friction Items:       CRITICAL: ${scorecard.frictionCountBySeverity.CRITICAL}, MAJOR: ${scorecard.frictionCountBySeverity.MAJOR}, MINOR: ${scorecard.frictionCountBySeverity.MINOR}`);
  console.log(`OPERATIONAL ADOPTION INDEX:  ${scorecard.operationalAdoptionIndex}/100`);
  console.log("====================================================\n");

  const resultsPath = path.join(process.cwd(), "docs", "oap", "oap_execution_results.json");
  const outputPayload = {
    timestamp: new Date().toISOString(),
    scorecard,
    frictionItems,
    telemetryEventsSummary: {
      eventCount: events.length,
      sampleEvents: events.slice(0, 3),
    },
  };

  fs.writeFileSync(resultsPath, JSON.stringify(outputPayload, null, 2));
  console.log(`[OAP] Successfully recorded execution telemetry evidence to file://${resultsPath}\n`);
}

main().catch((err) => {
  console.error("[OAP Execution Error]", err);
  process.exit(1);
});
