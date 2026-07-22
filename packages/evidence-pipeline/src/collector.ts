import * as zlib from 'zlib';
import * as crypto from 'crypto';
import { EvidenceManifest } from '@platform/shared-contracts';

export interface IEvidenceCollector {
  processArtifact(
    sessionId: string,
    nodeId: string,
    type: 'SCREENSHOT' | 'HAR' | 'TRACE' | 'CONSOLE',
    rawContent: Buffer | string
  ): Promise<{ storageUri: string; sizeBytes: number; checksum: string }>;
}

export class LocalDiskEvidenceCollector implements IEvidenceCollector {
  private inMemoryStore: Map<string, Buffer> = new Map();

  async processArtifact(
    sessionId: string,
    nodeId: string,
    type: 'SCREENSHOT' | 'HAR' | 'TRACE' | 'CONSOLE',
    rawContent: Buffer | string
  ): Promise<{ storageUri: string; sizeBytes: number; checksum: string }> {
    let buffer = typeof rawContent === 'string' ? Buffer.from(rawContent, 'utf-8') : rawContent;

    // Gzip text-based artifacts (HAR, CONSOLE)
    if (type === 'HAR' || type === 'CONSOLE') {
      // Sensitive data scrubbing for HAR/Console
      const scrubbed = buffer.toString('utf-8')
        .replace(/"password":\s*"[^"]*"/gi, '"password":"[REDACTED]"')
        .replace(/"authorization":\s*"[^"]*"/gi, '"authorization":"[REDACTED]"');
      buffer = zlib.gzipSync(Buffer.from(scrubbed, 'utf-8'));
    }

    const checksum = crypto.createHash('md5').update(buffer).digest('hex');
    const storageUri = `s3://evidence-bucket/${sessionId}/${nodeId}/${type.toLowerCase()}_${checksum.slice(0, 8)}`;

    this.inMemoryStore.set(storageUri, buffer);

    return {
      storageUri,
      sizeBytes: buffer.length,
      checksum,
    };
  }

  buildManifest(
    sessionId: string,
    nodeId: string,
    artifacts: Array<{ type: 'SCREENSHOT' | 'HAR' | 'TRACE' | 'CONSOLE'; storageUri: string; sizeBytes: number; checksum: string }>
  ): EvidenceManifest {
    return {
      sessionId,
      nodeId,
      artifacts,
    };
  }
}
