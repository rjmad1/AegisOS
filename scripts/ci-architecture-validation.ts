import { architectureValidator } from '../src/platform/governance/ArchitectureValidator';
import { architectureAutoRemediator } from '../src/infrastructure/governance/ArchitectureAutoRemediator';

async function runArchitectureValidation() {
  console.log('================================================================');
  console.log('AegisOS Phase 6.1: Architecture Fitness Validation');
  console.log('================================================================');

  const report = architectureValidator.validate();

  console.log(`\nTimestamp: ${report.timestamp}`);
  if (report.metrics) {
    console.log(`Metrics:`);
    console.log(`  Max Dependency Depth: ${report.metrics.maxDependencyDepth}`);
    console.log(`  Cyclic Dependency Count: ${report.metrics.cyclicDependencyCount}`);
    console.log(`  Module Coupling Index: ${report.metrics.moduleCouplingIndex}`);
    console.log(`  Instability: ${report.metrics.instability}`);
    console.log(`  Layer Purity Score: ${report.metrics.layerPurityScore}%`);
  }
  console.log(`Violations Found: ${report.violationsFound}`);
  console.log(`Overall Status: ${report.clean ? 'CLEAN (PASS)' : 'VIOLATIONS DETECTED (FAIL)'}\n`);

  report.results.forEach((result, idx) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${idx + 1}. [${status}] ${result.rule}`);
    if (!result.passed && result.details) {
      result.details.forEach(detail => console.log(`   -> ${detail}`));
      
      const suggestions = architectureAutoRemediator.analyzeViolations(result.details);
      if (suggestions.length > 0) {
        console.log(`   💡 Remediation Suggestions:`);
        suggestions.forEach(s => {
          console.log(`      - Pattern: ${s.recommendedPattern}`);
          console.log(`        Explanation: ${s.explanation}`);
          if (s.candidatePatch) console.log(`        Patch: ${s.candidatePatch}`);
        });
      }
    }
  });

  console.log('\n================================================================');

  if (!report.clean) {
    console.error('Architecture Validation Failed. Build will exit with code 1.');
    process.exit(1);
  } else {
    console.log('Architecture Validation Passed. Build may proceed.');
    process.exit(0);
  }
}

runArchitectureValidation().catch(err => {
  console.error('An unexpected error occurred during architecture validation:', err);
  process.exit(1);
});
