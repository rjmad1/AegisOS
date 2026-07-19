import { IQualificationProvider, QualificationRequest } from '../core/types';
import type { ValidationResult } from '../../validation/types';
import { computeContentHash } from '../../certification/evidence-graph';
import * as fs from 'fs';
import * as path from 'path';

export class AiRuntimeProvider implements IQualificationProvider {
  public readonly providerId = 'ai-runtime';
  public readonly supportedDomains = ['ai-runtime' as any];
  public readonly dependencies = [];

  public async execute(request: QualificationRequest): Promise<ValidationResult> {
    console.log('[AiRuntimeProvider] Auditing AI runtime infrastructure and model manifest...');
    const startTime = Date.now();
    const logs: string[] = [];
    const anomalies: string[] = [];

    // 1. Verify ModelManifest.json
    const manifestPath = path.resolve(process.cwd(), 'ModelManifest.json');
    let modelsCount = 0;
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        modelsCount = manifest.models?.length || 0;
        logs.push(`Verified ModelManifest.json. Found ${modelsCount} registered models.`);
      } catch (err: unknown) {
        anomalies.push(`Failed to parse ModelManifest.json: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      anomalies.push('Error: ModelManifest.json is missing from root.');
    }

    // 2. Perform lightweight socket port checks
    // We check port 11434 (Ollama) and 4000 (LiteLLM)
    const checkPort = async (port: number): Promise<boolean> => {
      const net = require('net');
      return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(300);
        socket
          .once('connect', () => {
            socket.destroy();
            resolve(true);
          })
          .once('timeout', () => {
            socket.destroy();
            resolve(false);
          })
          .once('error', () => {
            socket.destroy();
            resolve(false);
          })
          .connect(port, '127.0.0.1');
      });
    };

    const isOllamaActive = await checkPort(11434);
    const isLiteLlmActive = await checkPort(4000);

    logs.push(`Ollama (port 11434) active status: ${isOllamaActive}`);
    logs.push(`LiteLLM Proxy (port 4000) active status: ${isLiteLlmActive}`);

    let score = 100;
    if (!isOllamaActive) {
      anomalies.push('Warning: Ollama inference port 11434 is unresponsive.');
      score -= 30;
    }
    if (!isLiteLlmActive) {
      anomalies.push('Warning: LiteLLM routing proxy port 4000 is unresponsive.');
      score -= 30;
    }

    score = Math.max(0, score);
    const status = score >= 90 ? 'PASS' : score >= 40 ? 'WARNING' : 'FAIL';

    const evidencePayload = {
      score,
      isOllamaActive,
      isLiteLlmActive,
      modelsCount,
      anomalies
    };

    const durationMs = Date.now() - startTime;

    return {
      id: `ai-runtime-res-${Date.now()}`,
      name: 'AI Runtime Qualification',
      domain: 'ai-runtime' as any,
      status,
      score,
      durationMs,
      timestamp: new Date().toISOString(),
      message: anomalies.length === 0
        ? 'AI models manifest is valid and local inference ports are fully active.'
        : `AI runtime audit found ${anomalies.length} warnings.`,
      evidence: {
        provenance: {
          traceId: `trace-ai-${Date.now()}`,
          executionId: `exec-ai-${Date.now()}`,
          gitSha: request.correlationId,
          platformVersion: '1.0.0',
          timestamp: new Date().toISOString(),
          generatorId: this.providerId,
          generatorVersion: '1.0.0'
        },
        contentHash: computeContentHash(evidencePayload),
        logs: [
          ...logs,
          ...anomalies.map((a) => `[ANOMALY] ${a}`),
          `AI runtime check finished. Status: ${status}`
        ],
        metrics: {
          score,
          modelsCount,
          isOllamaActive: isOllamaActive ? 1 : 0,
          isLiteLlmActive: isLiteLlmActive ? 1 : 0
        }
      }
    };
  }
}

export const aiRuntimeProvider = new AiRuntimeProvider();
export default aiRuntimeProvider;
