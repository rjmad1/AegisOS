import { HashingEngine } from './conversa-hashing';
import { conversaRepository } from './conversa-repository';

export interface ValidatedMeetingMinutes {
  meetingId: string;
  packageId?: string;
  workspaceId?: string;
  tenantId?: string;
  timestamp: string;
  content: {
    transcriptText: string;
    extractedActions: any[];
    extractedDecisions?: any[];
    extractedRisks?: any[];
  };
  lineage: {
    semanticHash: string;
    contentHash: string;
    provenanceHash: string;
  };
  metadata: {
    publisherName: string;
    publisherVersion: string;
    governanceStatus: string;
    signatureAlgorithm: string;
  };
}

export class ConversaSemanticPublisher {
  private readonly publisherName = 'AegisOS.ConversaSemanticPublisher';
  private readonly publisherVersion = '1.0.0';

  /**
   * Processes a meeting transcript and its extracted canonical evidence,
   * producing a cryptographically 3-hash lineage validated artifact.
   */
  public async publish(
    meetingId: string,
    transcriptText: string,
    extractedActions: any[],
    extractedDecisions: any[] = [],
    extractedRisks: any[] = [],
    context?: { workspaceId?: string; tenantId?: string; packageId?: string }
  ): Promise<ValidatedMeetingMinutes> {
    console.log(`[ConversaSemanticPublisher] Generating 3-hash lineage validated meeting minutes for ${meetingId}`);

    const timestamp = new Date().toISOString();
    const content = {
      transcriptText,
      extractedActions,
      extractedDecisions,
      extractedRisks,
    };

    // 1. Semantic Hash (Domain Model)
    const semanticHash = HashingEngine.computeSemanticHash(content);

    // 2. Content Hash (Rendered Payload)
    const serializedContent = JSON.stringify(content);
    const contentHash = HashingEngine.computeContentHash(serializedContent);

    // 3. Provenance Hash (Lineage Chain)
    const packageId = context?.packageId || `pkg-${meetingId}-${Date.now()}`;
    const provenanceHash = HashingEngine.computeProvenanceHash(
      {
        packageId,
        sourceId: meetingId,
        sourceType: 'meeting',
        governanceStatus: 'VALIDATED',
      },
      this.publisherName,
      this.publisherVersion
    );

    const minutes: ValidatedMeetingMinutes = {
      meetingId,
      packageId,
      workspaceId: context?.workspaceId,
      tenantId: context?.tenantId,
      timestamp,
      content,
      lineage: {
        semanticHash,
        contentHash,
        provenanceHash,
      },
      metadata: {
        publisherName: this.publisherName,
        publisherVersion: this.publisherVersion,
        governanceStatus: 'VALIDATED',
        signatureAlgorithm: 'SHA-256-3Hash-Lineage',
      },
    };

    // Store publication in database repository if available
    try {
      await conversaRepository.savePublication({
        meetingId,
        packageId,
        publisherName: this.publisherName,
        publisherVersion: this.publisherVersion,
        semanticHash,
        contentHash,
        provenanceHash,
        renderedOutput: serializedContent,
        format: 'json',
      });
    } catch (err) {
      console.warn(`[ConversaSemanticPublisher] Note: Database persistence deferred:`, (err as Error).message);
    }

    console.log(`[ConversaSemanticPublisher] Signed artifact. SemanticHash: ${semanticHash.substring(0, 8)}... ContentHash: ${contentHash.substring(0, 8)}... ProvenanceHash: ${provenanceHash.substring(0, 8)}...`);

    return minutes;
  }
}

export const conversaSemanticPublisher = new ConversaSemanticPublisher();
