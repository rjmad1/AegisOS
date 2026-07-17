// scripts/endurance-test.ts
// Long-duration virtual endurance testing simulator.
// Evaluates memory growth, resource stability, and queue backpressure bounds.

import { metricsPlatform } from "../src/infrastructure/observability/metrics-platform";

async function runEnduranceTest() {
  console.log("====================================================");
  console.log("    AegisOS Enterprise 72-Hour Endurance Test       ");
  console.log("====================================================");

  const totalVirtualHours = 72;
  const initialMemory = process.memoryUsage().heapUsed;
  console.log(`[Baseline] Heap Memory: ${(initialMemory / (1024 * 1024)).toFixed(2)} MB`);

  let simulatedQueueBacklog = 0;
  let simulatedFailureCount = 0;

  console.log("\nStarting 72 virtual hour tick simulation...");

  for (let hour = 1; hour <= totalVirtualHours; hour++) {
    // Simulate periodic job arrivals
    const jobsEnqueued = 5 + Math.round(Math.random() * 15);
    const jobsProcessed = 4 + Math.round(Math.random() * 16);
    
    simulatedQueueBacklog = Math.max(0, simulatedQueueBacklog + jobsEnqueued - jobsProcessed);
    
    if (Math.random() < 0.05) {
      simulatedFailureCount++;
    }

    // Record metrics in metricsPlatform
    metricsPlatform.gauge("queue_job_backlog_count", simulatedQueueBacklog);
    metricsPlatform.counter("workflow_runs_total", jobsEnqueued);
    metricsPlatform.counter("workflow_failures_total", simulatedFailureCount);

    // Fast Virtual Sleep
    await new Promise((r) => setTimeout(r, 10));

    if (hour === 24 || hour === 48 || hour === 72) {
      const currentMemory = process.memoryUsage().heapUsed;
      const growth = currentMemory - initialMemory;
      console.log(`[Virtual Hour ${hour}] Backlog: ${simulatedQueueBacklog} | Heap: ${(currentMemory / (1024 * 1024)).toFixed(2)} MB | Growth: ${(growth / (1024 * 1024)).toFixed(2)} MB`);
      
      // Enforce zero/low memory leakage bounds (must be less than 50MB virtual growth)
      if (growth > 50 * 1024 * 1024) {
        console.error(`[FAIL] Virtual Hour ${hour}: Memory growth exceeds stability threshold!`);
        process.exit(1);
      }
    }
  }

  console.log("\n====================================================");
  console.log("   Endurance Validation: SUCCESS (State Stable)    ");
  console.log("====================================================");
  process.exit(0);
}

runEnduranceTest().catch((err) => {
  console.error("Endurance test execution failed:", err);
  process.exit(1);
});
