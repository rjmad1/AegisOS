import { createHash } from 'crypto';

export class CanonicalSerializer {
  /**
   * Sorts object keys recursively to produce deterministic canonical JSON strings.
   */
  public static serialize(obj: any, options?: { excludeVolatileFields?: boolean }): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
      return '[' + obj.map(item => CanonicalSerializer.serialize(item, options)).join(',') + ']';
    }

    const keys = Object.keys(obj).sort();
    const volatileKeys = new Set(['timestamp', 'createdAt', 'updatedAt', 'generatedAt']);

    const keyValues: string[] = [];
    for (const key of keys) {
      if (options?.excludeVolatileFields && volatileKeys.has(key)) {
        continue;
      }
      const val = obj[key];
      if (val !== undefined) {
        keyValues.push(`${JSON.stringify(key)}:${CanonicalSerializer.serialize(val, options)}`);
      }
    }

    return '{' + keyValues.join(',') + '}';
  }
}

export class HashingEngine {
  /**
   * Calculates SHA-256 hex digest of string or buffer data.
   */
  public static sha256(data: string | Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Calculates the Semantic Hash representing the domain meaning of a publication.
   */
  public static computeSemanticHash(semanticModel: Record<string, unknown>): string {
    const canonicalString = CanonicalSerializer.serialize(semanticModel, { excludeVolatileFields: true });
    return this.sha256(canonicalString);
  }

  /**
   * Calculates the Content Hash representing the rendered output byte/text stream.
   */
  public static computeContentHash(renderedContent: string | Buffer | Record<string, unknown>): string {
    const data = typeof renderedContent === 'string'
      ? renderedContent
      : Buffer.isBuffer(renderedContent)
      ? renderedContent
      : CanonicalSerializer.serialize(renderedContent);
    return this.sha256(data);
  }

  /**
   * Calculates the Provenance Hash for a knowledge package and publisher lineage.
   */
  public static computeProvenanceHash(
    sourcePackage: {
      packageId: string;
      sourceId?: string;
      sourceType?: string;
      evidencePackageIds?: string[];
      provenanceSummary?: string[];
      privacyClassification?: string;
      governanceStatus?: string;
    },
    publisherName: string,
    publisherVersion: string = '1.0.0'
  ): string {
    const lineagePayload = {
      packageId: sourcePackage.packageId,
      sourceId: sourcePackage.sourceId || '',
      sourceType: sourcePackage.sourceType || 'meeting',
      evidencePackageIds: (sourcePackage.evidencePackageIds || []).slice().sort(),
      provenanceSummary: sourcePackage.provenanceSummary || [],
      privacyClassification: sourcePackage.privacyClassification || 'Internal',
      governanceStatus: sourcePackage.governanceStatus || 'VALIDATED',
      publisherName,
      publisherVersion,
    };

    const canonicalLineage = CanonicalSerializer.serialize(lineagePayload);
    return this.sha256(canonicalLineage);
  }
}
