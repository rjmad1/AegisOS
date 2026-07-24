// src/infrastructure/contracts/secure-vault.ts
// Decoupled Secrets & Vault Provider Contract for AegisOS Platform Infrastructure

export interface VaultSecretEntry {
  key: string;
  value: string;
  version?: number;
  updatedAt: string;
}

export interface ISecureVaultProvider {
  getSecret(key: string): Promise<string | null>;
  setSecret(key: string, value: string): Promise<void>;
  deleteSecret(key: string): Promise<boolean>;
  hasSecret(key: string): Promise<boolean>;
}
