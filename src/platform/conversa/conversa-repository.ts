import { PrismaClient } from '@prisma/client';

export interface CreateMeetingInput {
  title: string;
  description?: string;
  workspaceId?: string;
  tenantId?: string;
  privacyClassification?: string;
  audioUrl?: string;
  duration?: number;
  speakerCount?: number;
}

export interface CreateEvidenceInput {
  meetingId: string;
  claim: string;
  speaker?: string;
  lineNumbers: number[];
  confidenceScore: number;
  privacyClassification?: string;
  category: 'ActionItem' | 'Decision' | 'Risk' | 'Fact';
}

export interface CreateKnowledgePackageInput {
  meetingId: string;
  title: string;
  summary: string;
  actions: any[];
  decisions: any[];
  risks: any[];
  consensusScore: number;
  governanceStatus?: string;
  cryptographicSignature: string;
}

export interface CreatePublicationInput {
  meetingId: string;
  packageId: string;
  publisherName: string;
  publisherVersion?: string;
  semanticHash: string;
  contentHash: string;
  provenanceHash: string;
  renderedOutput: string;
  format: 'markdown' | 'json' | 'html';
}

export class ConversaRepository {
  private static instance: ConversaRepository | null = null;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): ConversaRepository {
    if (!ConversaRepository.instance) {
      ConversaRepository.instance = new ConversaRepository();
    }
    return ConversaRepository.instance;
  }

  // --- Meetings ---
  public async createMeeting(input: CreateMeetingInput) {
    return this.prisma.conversaMeeting.create({
      data: {
        title: input.title,
        description: input.description,
        workspaceId: input.workspaceId,
        tenantId: input.tenantId,
        privacyClassification: input.privacyClassification || 'Internal',
        audioUrl: input.audioUrl,
        duration: input.duration,
        speakerCount: input.speakerCount,
      },
    });
  }

  public async getMeetingById(id: string) {
    return this.prisma.conversaMeeting.findUnique({
      where: { id },
    });
  }

  public async updateMeetingStatus(id: string, status: string) {
    return this.prisma.conversaMeeting.update({
      where: { id },
      data: { status },
    });
  }

  public async listMeetings(workspaceId?: string) {
    return this.prisma.conversaMeeting.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Transcripts ---
  public async saveTranscript(meetingId: string, rawText: string, formattedTranscript?: any) {
    return this.prisma.conversaTranscript.upsert({
      where: { meetingId },
      create: {
        meetingId,
        rawText,
        formattedTranscript: formattedTranscript ? JSON.stringify(formattedTranscript) : null,
      },
      update: {
        rawText,
        formattedTranscript: formattedTranscript ? JSON.stringify(formattedTranscript) : null,
      },
    });
  }

  public async getTranscript(meetingId: string) {
    return this.prisma.conversaTranscript.findUnique({
      where: { meetingId },
    });
  }

  // --- Evidence ---
  public async addEvidence(input: CreateEvidenceInput) {
    return this.prisma.conversaEvidence.create({
      data: {
        meetingId: input.meetingId,
        claim: input.claim,
        speaker: input.speaker,
        lineNumbers: JSON.stringify(input.lineNumbers),
        confidenceScore: input.confidenceScore,
        privacyClassification: input.privacyClassification || 'Internal',
        category: input.category,
      },
    });
  }

  public async getEvidenceForMeeting(meetingId: string) {
    return this.prisma.conversaEvidence.findMany({
      where: { meetingId },
    });
  }

  // --- Knowledge Packages ---
  public async saveKnowledgePackage(input: CreateKnowledgePackageInput) {
    return this.prisma.conversaKnowledgePackage.create({
      data: {
        meetingId: input.meetingId,
        title: input.title,
        summary: input.summary,
        actions: JSON.stringify(input.actions),
        decisions: JSON.stringify(input.decisions),
        risks: JSON.stringify(input.risks),
        consensusScore: input.consensusScore,
        governanceStatus: input.governanceStatus || 'VALIDATED',
        cryptographicSignature: input.cryptographicSignature,
      },
    });
  }

  // --- Publications ---
  public async savePublication(input: CreatePublicationInput) {
    return this.prisma.conversaPublication.create({
      data: {
        meetingId: input.meetingId,
        packageId: input.packageId,
        publisherName: input.publisherName,
        publisherVersion: input.publisherVersion || '1.0.0',
        semanticHash: input.semanticHash,
        contentHash: input.contentHash,
        provenanceHash: input.provenanceHash,
        renderedOutput: input.renderedOutput,
        format: input.format,
      },
    });
  }

  public async getPublicationsForMeeting(meetingId: string) {
    return this.prisma.conversaPublication.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Living Knowledge Graph Nodes & Edges ---
  public async createGraphNode(meetingId: string | null, label: string, type: string, properties: Record<string, any>) {
    return this.prisma.conversaGraphNode.create({
      data: {
        meetingId,
        label,
        type,
        properties: JSON.stringify(properties),
      },
    });
  }

  public async createGraphEdge(sourceNodeId: string, targetNodeId: string, relationship: string, properties?: Record<string, any>) {
    return this.prisma.conversaGraphEdge.create({
      data: {
        sourceNodeId,
        targetNodeId,
        relationship,
        properties: properties ? JSON.stringify(properties) : null,
      },
    });
  }

  public async getGraphTopology() {
    const nodes = await this.prisma.conversaGraphNode.findMany();
    const edges = await this.prisma.conversaGraphEdge.findMany();
    return {
      nodes: nodes.map((n: any) => ({ ...n, properties: JSON.parse(n.properties) })),
      edges: edges.map((e: any) => ({ ...e, properties: e.properties ? JSON.parse(e.properties) : {} })),
    };
  }
}

export const conversaRepository = ConversaRepository.getInstance();
