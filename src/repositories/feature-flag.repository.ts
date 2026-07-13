// src/repositories/feature-flag.repository.ts
// Relational SQLite Persistence for Feature Flags using Prisma ORM

import prisma from "../infrastructure/db/prisma";
export interface FeatureFlag {
  id: string;
  name: string;
  category: 'platform' | 'experimental' | 'provider' | 'ui';
  description: string;
  enabled: boolean;
}

export class FeatureFlagRepository {
  async getAllFlags(): Promise<FeatureFlag[]> {
    const records = await prisma.featureFlag.findMany();
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category as any,
      description: r.description,
      enabled: r.enabled,
    }));
  }

  async saveFlag(flag: FeatureFlag): Promise<void> {
    await prisma.featureFlag.upsert({
      where: { id: flag.id },
      update: {
        name: flag.name,
        category: flag.category,
        description: flag.description,
        enabled: flag.enabled,
      },
      create: {
        id: flag.id,
        name: flag.name,
        category: flag.category,
        description: flag.description,
        enabled: flag.enabled,
      },
    });
  }

  async toggleFlag(id: string, enabled: boolean): Promise<FeatureFlag | undefined> {
    const record = await prisma.featureFlag.update({
      where: { id },
      data: { enabled },
    });
    if (!record) return undefined;
    return {
      id: record.id,
      name: record.name,
      category: record.category as any,
      description: record.description,
      enabled: record.enabled,
    };
  }
}

export const featureFlagRepository = new FeatureFlagRepository();
export default featureFlagRepository;
