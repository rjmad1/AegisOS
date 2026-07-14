#!/usr/bin/env node

/**
 * AegisOS Unified Platform CLI
 * Scaffolding, project creation, diagnostics, doctor checks, benchmarks
 */

const fs = require('fs');
const path = require('path');

// Setup aliases for ts-node usage if running directly
require('ts-node').register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2022',
    moduleResolution: 'node'
  }
});

// Setup paths mapping manually since tsconfig-paths is not globally loaded
const tsconfig = require('../tsconfig.json');
const paths = tsconfig.compilerOptions.paths;
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain) {
  if (request.startsWith('@/')) {
    const relative = request.substring(2);
    const target = path.resolve(__dirname, '../src', relative);
    // Find matching extensions
    for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.json']) {
      if (fs.existsSync(target + ext)) {
        return target + ext;
      }
    }
    return target;
  }
  return originalResolveFilename.apply(this, arguments);
};

const cliEngine = require('../src/platform/developer/cli/cli-engine').cliEngine;

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help' || command === '--help') {
  console.log(`
AegisOS Platform CLI — Command Center

Usage:
  node scripts/platform-cli.js <command> [options]

Commands:
  doctor              Runs comprehensive system diagnostic checks.
  generate <type> <n> Scaffolds a new template (types: plugin, agent, workflow, tool).
  backup [file]       Generates a configuration snapshot backup.
  restore <file>      Restores configuration from a snapshot.
  benchmark           Runs performance metrics checks on AI runtime modules.

Examples:
  node scripts/platform-cli.js doctor
  node scripts/platform-cli.js generate plugin ASTSearcher
  node scripts/platform-cli.js backup ./databases/backup.json
  `);
  process.exit(0);
}

switch (command) {
  case 'doctor':
    console.log('[CLI] Running doctor checks...');
    const docRes = cliEngine.doctor();
    console.log(`[Doctor Result] ${docRes.message}`);
    docRes.data.forEach(check => console.log(`  - ${check}`));
    process.exit(docRes.success ? 0 : 1);

  case 'generate':
    const type = args[1];
    const name = args[2];
    if (!type || !name) {
      console.error('[CLI] Error: generate command requires type (plugin/agent/workflow/tool) and name options.');
      process.exit(1);
    }
    const genRes = cliEngine.generate(type, name);
    console.log(`[CLI:Generate] ${genRes.message}`);
    process.exit(genRes.success ? 0 : 1);

  case 'backup':
    const target = args[1];
    console.log('[CLI] Executing backup...');
    const backRes = cliEngine.backup(target);
    console.log(`[CLI:Backup] ${backRes.message}`);
    process.exit(backRes.success ? 0 : 1);

  case 'restore':
    const source = args[1];
    if (!source) {
      console.error('[CLI] Error: restore command requires a backup source file path.');
      process.exit(1);
    }
    console.log('[CLI] Executing restore...');
    const restRes = cliEngine.restore(source);
    console.log(`[CLI:Restore] ${restRes.message}`);
    process.exit(restRes.success ? 0 : 1);

  case 'benchmark':
    console.log('[CLI] Executing system benchmarks...');
    const benchRes = cliEngine.benchmark();
    console.log(`[CLI:Benchmark] ${benchRes.message}`);
    console.log(`  - Total Duration: ${benchRes.data.totalDurationMs} ms`);
    console.log(`  - Token Throughput: ${benchRes.data.tokensPerSecond} tokens/second`);
    console.log(`  - Average Token Latency: ${benchRes.data.averageTokenLatencyMs} ms`);
    console.log('Stages:');
    benchRes.data.stages.forEach(stg => console.log(`  - [${stg.status.toUpperCase()}] ${stg.step}: ${stg.durationMs} ms`));
    process.exit(0);

  default:
    console.error(`[CLI] Unknown command: "${command}". Run "node scripts/platform-cli.js help" for details.`);
    process.exit(1);
}
