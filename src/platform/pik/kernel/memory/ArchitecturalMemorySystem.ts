// src/platform/pik/kernel/memory/ArchitecturalMemorySystem.ts
import * as fs from 'fs';
import * as path from 'path';
import { ArchitecturalMemory } from '../../types';
import { knowledgeGraphEngine } from '../../../knowledge/KnowledgeGraphEngine';
import prisma from '../../../../infrastructure/db/prisma';

export class ArchitecturalMemorySystem {
  private static instance: ArchitecturalMemorySystem | null = null;
  private rootDir = path.resolve(process.cwd());

  private constructor() {}

  public static getInstance(): ArchitecturalMemorySystem {
    if (!ArchitecturalMemorySystem.instance) {
      ArchitecturalMemorySystem.instance = new ArchitecturalMemorySystem();
    }
    return ArchitecturalMemorySystem.instance;
  }

  /**
   * Ingests a new engineering memory, writing it to Markdown and syncing with EKG/DB.
   */
  public async ingestMemory(memory: ArchitecturalMemory): Promise<void> {
    const memoryDir = path.join(this.rootDir, 'docs', 'architecture', 'memory');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }

    const fileName = `${memory.id}.md`;
    const filePath = path.join(memoryDir, fileName);
    const relativeLocation = `docs/architecture/memory/${fileName}`;

    // 1. Write to Git-tracked Markdown file
    const markdownContent = this.generateMarkdown(memory);
    fs.writeFileSync(filePath, markdownContent, 'utf8');
    console.log(`📝 [AKMS] Persisted architectural memory to: ${relativeLocation}`);

    // 2. Upsert in DB Artifact table (reusing schemas for memory)
    const nodeId = `memory:${memory.id}`;
    const now = new Date().toISOString();
    const tags = ['memory', memory.category, memory.status];

    try {
      await prisma.artifact.upsert({
        where: { id: nodeId },
        update: {
          name: memory.title,
          description: memory.decision,
          modifiedDate: now,
          tags: JSON.stringify(tags),
          metadata: JSON.stringify(memory),
          location: relativeLocation
        },
        create: {
          id: nodeId,
          name: memory.title,
          description: memory.decision,
          type: 'documentation',
          mimeType: 'text/markdown',
          size: Buffer.byteLength(markdownContent),
          createdDate: now,
          modifiedDate: now,
          createdBy: 'platform-intelligence-kernel',
          tags: JSON.stringify(tags),
          status: 'active',
          location: relativeLocation,
          previewSupported: true,
          downloadSupported: true,
          deleteSupported: false,
          version: memory.introducedVersion,
          conversationId: 'system',
          workflowId: 'system',
          metadata: JSON.stringify(memory),
          lifecycleState: 'active',
          storage: JSON.stringify({ provider: 'local' }),
          relationships: JSON.stringify([]),
          preview: '{}',
          processing: '{}',
          search: '{}'
        }
      });
    } catch (err: any) {
      console.error(`[AKMS] Failed to persist memory Artifact in DB: ${err.message}`);
    }

    // 3. Register in in-memory Engineering Knowledge Graph
    knowledgeGraphEngine.addNode({
      id: nodeId,
      label: memory.title,
      type: 'documentation',
      properties: {
        ...memory,
        location: relativeLocation
      },
      lineageId: nodeId,
      version: memory.introducedVersion,
      owner: 'platform-intelligence-kernel',
      confidence: 1.0,
      trustScore: 1.0,
      sourceReferences: [`file:///${filePath.replace(/\\/g, '/')}`]
    });

    // Link memory to related artifacts
    if (memory.relatedArtifacts) {
      memory.relatedArtifacts.forEach(relatedId => {
        knowledgeGraphEngine.addRelationship({
          id: `rel:${nodeId}:${relatedId}:references`,
          sourceId: nodeId,
          targetId: relatedId,
          type: 'references',
          weight: 1.0,
          trustScore: 1.0,
          provenance: 'Architectural Memory cross-reference'
        });
      });
    }
  }

  /**
   * Fetches all registered memories from EKG
   */
  public getMemories(): ArchitecturalMemory[] {
    const nodes = knowledgeGraphEngine.getNodes().filter(n => n.id.startsWith('memory:'));
    return nodes.map(n => n.properties as unknown as ArchitecturalMemory);
  }

  private generateMarkdown(memory: ArchitecturalMemory): string {
    return `---
id: ${memory.id}
title: ${memory.title}
category: ${memory.category}
status: ${memory.status}
introducedVersion: ${memory.introducedVersion}
timestamp: ${memory.timestamp}
---

# ${memory.title}

| Metadata | Value |
|---|---|
| **Memory ID** | ${memory.id} |
| **Category** | ${memory.category} |
| **Status** | ${memory.status} |
| **Introduced Version** | ${memory.introducedVersion} |
| **Timestamp** | ${memory.timestamp} |

## Context
${memory.context}

## Decision
${memory.decision}

## Trade-offs
${memory.tradeOffs}

## Consequences
${memory.consequences}
`;
  }
}

export const architecturalMemorySystem = ArchitecturalMemorySystem.getInstance();
export default architecturalMemorySystem;
