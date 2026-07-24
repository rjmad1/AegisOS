// src/infrastructure/adapters/environment-vault.ts
// Environment & Local Storage Adapter implementation of ISecureVaultProvider

import { ISecureVaultProvider } from "../contracts/secure-vault";

export class EnvironmentVaultAdapter implements ISecureVaultProvider {
  private fallbackStore: Map<string, string> = new Map();

  async getSecret(key: string): Promise<string | null> {
    if (process.env[key] !== undefined) {
      return process.env[key]!;
    }
    return this.fallbackStore.get(key) || null;
  }

  async setSecret(key: string, value: string): Promise<void> {
    this.fallbackStore.set(key, value);
    process.env[key] = value;
  }

  async deleteSecret(key: string): Promise<boolean> {
    const existed = this.fallbackStore.has(key) || process.env[key] !== undefined;
    this.fallbackStore.delete(key);
    delete process.env[key];
    return existed;
  }

  async hasSecret(key: string): Promise<boolean> {
    return process.env[key] !== undefined || this.fallbackStore.has(key);
  }
}
