import { DeclarativeWorkloadConfig } from '../engine/declarative-runner';

export const CanonicalWorkloads: DeclarativeWorkloadConfig[] = [
  {
    id: 'wl-enterprise-research',
    version: 1,
    inputs: { documents: ['pdf', 'image', 'docx'] },
    steps: ['ingest', 'embed', 'retrieve', 'reason', 'cite', 'summarize'],
    budgets: { latencyMs: 600000, memoryMB: 4096, gpuMB: 12288 },
    expected: { score: 95, citations: true, hallucination: false }
  },
  {
    id: 'wl-agent-collaboration',
    version: 1,
    inputs: { agents: 3, taskComplexity: 'high' },
    steps: ['delegate', 'deliberate', 'consensus', 'execute'],
    budgets: { latencyMs: 300000, memoryMB: 2048 },
    expected: { score: 95, deadlock: false }
  },
  {
    id: 'wl-code-generation',
    version: 1,
    inputs: { contextSize: 10000, language: 'typescript' },
    steps: ['parse', 'plan', 'generate', 'lint', 'test'],
    budgets: { latencyMs: 120000, memoryMB: 4096 },
    expected: { score: 98, syntaxError: false, testPass: true }
  },
  {
    id: 'wl-architecture-review',
    version: 1,
    inputs: { repositorySize: 50000 },
    steps: ['scan', 'parse', 'analyze', 'report'],
    budgets: { latencyMs: 240000, memoryMB: 8192 },
    expected: { score: 95, falsePositives: '<5%' }
  },
  {
    id: 'wl-large-knowledge-ingestion',
    version: 1,
    inputs: { documentCount: 1000, type: 'mixed' },
    steps: ['extract', 'chunk', 'embed', 'index'],
    budgets: { latencyMs: 1800000, memoryMB: 16384 },
    expected: { score: 90, failureRate: '<1%' }
  },
  {
    id: 'wl-workflow-automation',
    version: 1,
    inputs: { dags: 50, concurrency: 10 },
    steps: ['schedule', 'execute', 'monitor', 'finalize'],
    budgets: { latencyMs: 60000, memoryMB: 1024 },
    expected: { score: 99, droppedEvents: 0 }
  },
  {
    id: 'wl-capability-marketplace',
    version: 1,
    inputs: { packageId: 'test-pkg' },
    steps: ['resolve', 'download', 'verify', 'install', 'test'],
    budgets: { latencyMs: 30000, memoryMB: 512 },
    expected: { score: 100, integrity: true }
  },
  {
    id: 'wl-mcp-ecosystem',
    version: 1,
    inputs: { serverCount: 5 },
    steps: ['connect', 'handshake', 'tool-discovery', 'execute-remote'],
    budgets: { latencyMs: 15000, memoryMB: 512 },
    expected: { score: 99, connectionDrops: 0 }
  },
  {
    id: 'wl-digital-twin-sync',
    version: 1,
    inputs: { entities: 10000 },
    steps: ['snapshot', 'diff', 'apply', 'validate'],
    budgets: { latencyMs: 120000, memoryMB: 4096 },
    expected: { score: 99, consistency: true }
  },
  {
    id: 'wl-human-approval',
    version: 1,
    inputs: { requests: 100 },
    steps: ['notify', 'wait', 'receive', 'audit'],
    budgets: { latencyMs: 5000, memoryMB: 256 },
    expected: { score: 100, auditTrail: true }
  },
  {
    id: 'wl-long-running-automation',
    version: 1,
    inputs: { durationHours: 24 },
    steps: ['start', 'heartbeat', 'checkpoint', 'recover', 'finish'],
    budgets: { latencyMs: 86400000, memoryMB: 1024 },
    expected: { score: 95, memoryLeak: false }
  },
  {
    id: 'wl-recovery-from-failure',
    version: 1,
    inputs: { fault: 'network-partition' },
    steps: ['inject', 'detect', 'isolate', 'recover', 'verify'],
    budgets: { latencyMs: 30000, memoryMB: 1024 },
    expected: { score: 99, dataLoss: false }
  },
  {
    id: 'wl-planning-scheduling',
    version: 1,
    inputs: { tasks: 500, constraints: 100 },
    steps: ['parse', 'optimize', 'allocate', 'schedule'],
    budgets: { latencyMs: 15000, memoryMB: 2048 },
    expected: { score: 95, constraintsViolated: 0 }
  },
  {
    id: 'wl-executive-dashboard',
    version: 1,
    inputs: { dataPoints: 1000000 },
    steps: ['query', 'aggregate', 'render'],
    budgets: { latencyMs: 2000, memoryMB: 2048 },
    expected: { score: 98, latencyP99: '<2000ms' }
  },
  {
    id: 'wl-multi-modal-processing',
    version: 1,
    inputs: { videoLengthSec: 60, audioLengthSec: 120 },
    steps: ['decode', 'transcribe', 'analyze-frames', 'synthesize'],
    budgets: { latencyMs: 300000, memoryMB: 8192, gpuMB: 16384 },
    expected: { score: 90, alignmentError: '<1s' }
  }
];
