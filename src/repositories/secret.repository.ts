// src/repositories/secret.repository.ts
// Relational SQLite Persistence for Encrypted Secrets using Prisma ORM, routing through the swappable SecretsPlatform

import prisma from "../infrastructure/db/prisma";
import secretsPlatform from "../infrastructure/security/secrets-platform";

export interface EncryptedSecretEntry {
  key: string;
  encryptedValue: string;
  iv: string;
  authTag: string;
  updatedAt: string;
}

export class SecretRepository {
  async getAllSecrets(): Promise<EncryptedSecretEntry[]> {
    const records = await prisma.secret.findMany();
    return records.map((r) => ({
      key: r.key,
      encryptedValue: r.encryptedValue,
      iv: r.iv,
      authTag: r.authTag,
      updatedAt: r.updatedAt,
    }));
  }

  async getSecret(keyName: string): Promise<string | null> {
    return secretsPlatform.getSecret(keyName);
  }

  async saveSecret(keyName: string, plainValue: string): Promise<void> {
    return secretsPlatform.saveSecret(keyName, plainValue);
  }

  async deleteSecret(keyName: string): Promise<void> {
    return secretsPlatform.deleteSecret(keyName);
  }
}

export const secretRepository = new SecretRepository();
export default secretRepository;
