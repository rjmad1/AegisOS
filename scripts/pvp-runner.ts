// scripts/pvp-runner.ts

import * as fs from "fs";
import * as path from "path";
import { pvpEngine, PVPMissionResult, PlatformScorecard } from "../src/platform/pvp/pvp-engine";

async function main() {
  console.log("====================================================");
  console.log("   AEGIS-OS PLATFORM VALIDATION PROGRAM (PVP)");
  console.log("   Official Acceptance Framework for Release RC1");
  console.log("====================================================\n");

  const catalog = pvpEngine.loadCatalog();
  console.log(`[PVP] Loaded Mission Validation Library (${catalog.length} Production Missions)\n`);

  const results: PVPMissionResult[] = [];

  for (let i = 0; i < catalog.length; i++) {
    const spec = catalog[i];
    process.stdout.write(`[${i + 1}/${catalog.length}] Executing Mission ${spec.missionId} [${spec.category} / ${spec.subcategory}]... `);

    const result = await pvpEngine.runMission(spec);
    results.push(result);

    const statusBadge = result.status === "PASS" ? "✓ PASS" : result.status === "WARNING" ? "⚠ WARNING" : "✗ FAIL";
    console.log(`${statusBadge} (${(result.executionTimeMs / 1000).toFixed(1)}s)`);
  }

  const scorecard: PlatformScorecard = pvpEngine.computeScorecard(results);

  console.log("\n====================================================");
  console.log("             PLATFORM SCORECARD RESULTS");
  console.log("====================================================");
  console.log(`Total Missions Executed:     ${scorecard.totalMissions}`);
  console.log(`Passed (PASS):               ${scorecard.passedMissions}`);
  console.log(`Warnings (WARNING):           ${scorecard.warningMissions}`);
  console.log(`Failed (FAIL):               ${scorecard.failedMissions}`);
  console.log(`Mission Success Rate:        ${scorecard.missionSuccessRatePercent}%`);
  console.log(`Avg Completion Time:         ${scorecard.avgCompletionTimeSeconds}s`);
  console.log(`Avg Reflection Cycles:       ${scorecard.avgReflectionCycles}`);
  console.log(`Avg Agent Count:             ${scorecard.avgAgentCount}`);
  console.log(`Avg Tool Usage:              ${scorecard.avgToolUsage}`);
  console.log(`Avg Artifact Quality:        ${scorecard.avgArtifactQualityScore}/100`);
  console.log(`Avg Recovery Count:          ${scorecard.avgRecoveryCount}`);
  console.log(`Avg User Intervention:       ${scorecard.avgUserInterventionCount}`);
  console.log("----------------------------------------------------");
  console.log(`PLATFORM READINESS SCORE:    ${scorecard.platformReadinessScore}/100`);
  console.log("====================================================\n");

  // Save JSON execution results for evidence package
  const resultsPath = path.join(process.cwd(), "docs", "pvp", "pvp_execution_results.json");
  const outputPayload = {
    timestamp: new Date().toISOString(),
    scorecard,
    results,
  };

  fs.writeFileSync(resultsPath, JSON.stringify(outputPayload, null, 2));
  console.log(`[PVP] Recorded execution evidence to file://${resultsPath}\n`);
}

main().catch((err) => {
  console.error("[PVP Execution Error]", err);
  process.exit(1);
});
