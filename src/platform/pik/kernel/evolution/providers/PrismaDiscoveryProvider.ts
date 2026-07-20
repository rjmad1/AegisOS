// src/platform/pik/kernel/evolution/providers/PrismaDiscoveryProvider.ts
import * as fs from 'fs';
import * as path from 'path';
import { DiscoveryProvider, CanonicalAsset } from './types';

export class PrismaDiscoveryProvider implements DiscoveryProvider {
  public get name(): string { return 'PrismaDiscoveryProvider'; }
  private rootDir = path.resolve(process.cwd());

  public async discover(): Promise<CanonicalAsset[]> {
    const assets: CanonicalAsset[] = [];
    const schemaPath = path.join(this.rootDir, 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) return assets;

    const content = fs.readFileSync(schemaPath, 'utf8');
    const models = this.parseSchema(content);

    for (const model of models) {
      assets.push({
        id: `database:model:${model.name.toLowerCase()}`,
        label: `Prisma Model: ${model.name}`,
        type: 'database',
        properties: {
          modelName: model.name,
          fields: model.fields,
          relations: model.relations
        },
        lineageId: `database:model:${model.name.toLowerCase()}`,
        version: '1.0.0',
        owner: 'data-engineering',
        confidence: 1.0,
        trustScore: 1.0,
        sourceReferences: [`file:///${schemaPath.replace(/\\/g, '/')}`]
      });
    }

    return assets;
  }

  private parseSchema(content: string): Array<{ name: string; fields: string[]; relations: string[] }> {
    const models: Array<{ name: string; fields: string[]; relations: string[] }> = [];
    const modelBlocks = content.matchAll(/model\s+(\w+)\s+\{([\s\S]*?)\}/g);

    for (const block of modelBlocks) {
      const modelName = block[1];
      const modelBody = block[2];
      const fields: string[] = [];
      const relations: string[] = [];

      const lines = modelBody.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('//')) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2) {
            const fieldName = parts[0];
            const fieldType = parts[1];
            fields.push(`${fieldName}: ${fieldType}`);

            // Detect relations
            if (trimmed.includes('@relation')) {
              relations.push(trimmed);
            }
          }
        }
      }

      models.push({
        name: modelName,
        fields,
        relations
      });
    }

    return models;
  }
}
