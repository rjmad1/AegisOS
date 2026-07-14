// src/infrastructure/security/secrets-platform.ts
// Swappable Secrets Platform Provider supporting HashiCorp Vault, Azure Key Vault, AWS, GCP, and Local DB.

import prisma from "../db/prisma";
import crypto from "crypto";

// Webpack-opaque dynamic require: prevents static analysis from trying to bundle optional cloud SDKs
function _optionalRequire(id: string): any {
  try {
    // The variable indirection prevents webpack from statically resolving the module
    const _r = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require;
    return _r(id);
  } catch {
    return null;
  }
}
declare const __webpack_require__: any;
declare const __non_webpack_require__: any;

export interface ISecretsProvider {
  getSecret(key: string): Promise<string | null>;
  saveSecret(key: string, value: string): Promise<void>;
  deleteSecret(key: string): Promise<void>;
}

// Derive a secure encryption key from the environment secret
function getEncryptionKey(): Buffer {
  const seed = process.env.OPS_JWT_SECRET;
  if (!seed) {
    throw new Error("FATAL: OPS_JWT_SECRET environment variable is required for secrets encryption.");
  }
  return crypto.scryptSync(seed, "platform-secrets-salt-2026", 32);
}

// -------------------------------------------------------------
// 1. Local Database Secrets Provider (Default Fallback)
// -------------------------------------------------------------
class LocalDatabaseSecretsProvider implements ISecretsProvider {
  private encrypt(plainText: string): { encryptedValue: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(12);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return {
      encryptedValue: encrypted,
      iv: iv.toString("hex"),
      authTag,
    };
  }

  private decrypt(encryptedValue: string, ivHex: string, authTagHex: string): string {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedValue, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  async getSecret(key: string): Promise<string | null> {
    const record = await prisma.secret.findUnique({
      where: { key },
    });
    if (!record) return null;
    try {
      return this.decrypt(record.encryptedValue, record.iv, record.authTag);
    } catch (e) {
      console.error(`[LocalSecretsProvider] Decryption failed for key ${key}:`, e);
      return null;
    }
  }

  async saveSecret(key: string, value: string): Promise<void> {
    const { encryptedValue, iv, authTag } = this.encrypt(value);
    await prisma.secret.upsert({
      where: { key },
      update: {
        encryptedValue,
        iv,
        authTag,
        updatedAt: new Date().toISOString(),
      },
      create: {
        key,
        encryptedValue,
        iv,
        authTag,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  async deleteSecret(key: string): Promise<void> {
    await prisma.secret.delete({
      where: { key },
    }).catch(() => {});
  }
}

// -------------------------------------------------------------
// 2. HashiCorp Vault Provider
// -------------------------------------------------------------
class VaultSecretsProvider implements ISecretsProvider {
  private client: any;
  private mountPath = 'secret';

  constructor() {
    const nodeVault = _optionalRequire('node-vault');
    if (nodeVault) {
      const vaultToken = process.env.VAULT_TOKEN;
      if (!vaultToken) {
        console.warn('[VaultSecretsProvider] VAULT_TOKEN not set. Vault provider disabled.');
      } else {
        this.client = nodeVault({
          apiVersion: 'v1',
          endpoint: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
          token: vaultToken
        });
      }
      this.mountPath = process.env.VAULT_MOUNT_PATH || 'secret';
    } else {
      console.warn('[VaultSecretsProvider] node-vault SDK not installed.');
    }
  }

  async getSecret(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      const res = await this.client.read(`${this.mountPath}/data/${key}`);
      return res?.data?.data?.value || null;
    } catch (err: any) {
      console.error(`[VaultSecretsProvider] Get secret failed for key ${key}:`, err.message);
      return null;
    }
  }

  async saveSecret(key: string, value: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.write(`${this.mountPath}/data/${key}`, {
        data: { value }
      });
    } catch (err: any) {
      console.error(`[VaultSecretsProvider] Save secret failed for key ${key}:`, err.message);
    }
  }

  async deleteSecret(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.delete(`${this.mountPath}/data/${key}`);
    } catch (err: any) {
      console.error(`[VaultSecretsProvider] Delete secret failed for key ${key}:`, err.message);
    }
  }
}

// -------------------------------------------------------------
// 3. AWS Secrets Manager Provider
// -------------------------------------------------------------
class AwsSecretsProvider implements ISecretsProvider {
  private client: any;

  constructor() {
    const awsSdk = _optionalRequire('@aws-sdk/client-secrets-manager');
    if (awsSdk) {
      this.client = new awsSdk.SecretsManagerClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        }
      });
    } else {
      console.warn('[AwsSecretsProvider] @aws-sdk/client-secrets-manager not installed.');
    }
  }

  async getSecret(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      const { GetSecretValueCommand } = _optionalRequire('@aws-sdk/client-secrets-manager') || {};
      const response = await this.client.send(new GetSecretValueCommand({ SecretId: key }));
      return response.SecretString || null;
    } catch (err: any) {
      console.error(`[AwsSecretsProvider] Get secret failed for key ${key}:`, err.message);
      return null;
    }
  }

  async saveSecret(key: string, value: string): Promise<void> {
    if (!this.client) return;
    try {
      const { CreateSecretCommand, PutSecretValueCommand } = _optionalRequire('@aws-sdk/client-secrets-manager') || {};
      try {
        await this.client.send(new CreateSecretCommand({ Name: key, SecretString: value }));
      } catch (err: any) {
        if (err.name === 'ResourceExistsException') {
          await this.client.send(new PutSecretValueCommand({ SecretId: key, SecretString: value }));
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error(`[AwsSecretsProvider] Save secret failed for key ${key}:`, err.message);
    }
  }

  async deleteSecret(key: string): Promise<void> {
    if (!this.client) return;
    try {
      const { DeleteSecretCommand } = _optionalRequire('@aws-sdk/client-secrets-manager') || {};
      await this.client.send(new DeleteSecretCommand({ SecretId: key, ForceDeleteWithoutRecovery: true }));
    } catch (err: any) {
      console.error(`[AwsSecretsProvider] Delete secret failed for key ${key}:`, err.message);
    }
  }
}

// -------------------------------------------------------------
// 4. Google Secret Manager Provider
// -------------------------------------------------------------
class GcpSecretsProvider implements ISecretsProvider {
  private client: any;
  private project: string = '';

  constructor() {
    const gcpSdk = _optionalRequire('@google-cloud/secret-manager');
    if (gcpSdk) {
      this.client = new gcpSdk.SecretManagerServiceClient();
      this.project = process.env.GCP_PROJECT_ID || 'aegisos-ops';
    } else {
      console.warn('[GcpSecretsProvider] @google-cloud/secret-manager not installed.');
    }
  }

  async getSecret(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      const name = `projects/${this.project}/secrets/${key}/versions/latest`;
      const [version] = await this.client.accessSecretVersion({ name });
      return version.payload.data.toString('utf8') || null;
    } catch (err: any) {
      console.error(`[GcpSecretsProvider] Get secret failed for key ${key}:`, err.message);
      return null;
    }
  }

  async saveSecret(key: string, value: string): Promise<void> {
    if (!this.client) return;
    try {
      const parent = `projects/${this.project}`;
      let secretName = `projects/${this.project}/secrets/${key}`;
      
      try {
        await this.client.createSecret({
          parent,
          secretId: key,
          secret: { replication: { automatic: {} } }
        });
      } catch (err: any) {
        // Ignore if secret already exists
      }

      await this.client.addSecretVersion({
        parent: secretName,
        payload: { data: Buffer.from(value, 'utf8') }
      });
    } catch (err: any) {
      console.error(`[GcpSecretsProvider] Save secret failed for key ${key}:`, err.message);
    }
  }

  async deleteSecret(key: string): Promise<void> {
    if (!this.client) return;
    try {
      const name = `projects/${this.project}/secrets/${key}`;
      await this.client.deleteSecret({ name });
    } catch (err: any) {
      console.error(`[GcpSecretsProvider] Delete secret failed for key ${key}:`, err.message);
    }
  }
}

// -------------------------------------------------------------
// 5. Azure Key Vault Provider
// -------------------------------------------------------------
class AzureSecretsProvider implements ISecretsProvider {
  private client: any;

  constructor() {
    const azureKv = _optionalRequire('@azure/keyvault-secrets');
    const azureId = _optionalRequire('@azure/identity');
    if (azureKv && azureId) {
      const vaultUrl = process.env.AZURE_KEYVAULT_URL || 'https://aegisosvault.vault.azure.net';
      const credential = new azureId.DefaultAzureCredential();
      this.client = new azureKv.SecretClient(vaultUrl, credential);
    } else {
      console.warn('[AzureSecretsProvider] @azure/keyvault-secrets or @azure/identity not installed.');
    }
  }

  async getSecret(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      const secret = await this.client.getSecret(key);
      return secret.value || null;
    } catch (err: any) {
      console.error(`[AzureSecretsProvider] Get secret failed for key ${key}:`, err.message);
      return null;
    }
  }

  async saveSecret(key: string, value: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.setSecret(key, value);
    } catch (err: any) {
      console.error(`[AzureSecretsProvider] Save secret failed for key ${key}:`, err.message);
    }
  }

  async deleteSecret(key: string): Promise<void> {
    if (!this.client) return;
    try {
      const poller = await this.client.beginDeleteSecret(key);
      await poller.pollUntilDone();
    } catch (err: any) {
      console.error(`[AzureSecretsProvider] Delete secret failed for key ${key}:`, err.message);
    }
  }
}

// -------------------------------------------------------------
// 6. Central Coordinator Factory
// -------------------------------------------------------------
class SecretsPlatform implements ISecretsProvider {
  private activeProvider: ISecretsProvider;
  private localProvider: LocalDatabaseSecretsProvider;

  constructor() {
    // Ensure critical encryption key is configured
    getEncryptionKey();

    this.localProvider = new LocalDatabaseSecretsProvider();
    this.activeProvider = this.localProvider;

    const providerType = process.env.SECRETS_PROVIDER || 'local';

    if (providerType === 'vault') {
      this.activeProvider = new VaultSecretsProvider();
      console.log('[SecretsPlatform] Configured active provider: HashiCorp Vault');
    } else if (providerType === 'aws') {
      this.activeProvider = new AwsSecretsProvider();
      console.log('[SecretsPlatform] Configured active provider: AWS Secrets Manager');
    } else if (providerType === 'gcp') {
      this.activeProvider = new GcpSecretsProvider();
      console.log('[SecretsPlatform] Configured active provider: Google Secret Manager');
    } else if (providerType === 'azure') {
      this.activeProvider = new AzureSecretsProvider();
      console.log('[SecretsPlatform] Configured active provider: Azure Key Vault');
    } else {
      console.log('[SecretsPlatform] Running Local Database Encrypted Secrets provider.');
    }
  }

  async getSecret(key: string): Promise<string | null> {
    return this.activeProvider.getSecret(key);
  }

  async saveSecret(key: string, value: string): Promise<void> {
    await this.activeProvider.saveSecret(key, value);
  }

  async deleteSecret(key: string): Promise<void> {
    await this.activeProvider.deleteSecret(key);
  }

  // Key Rotation method
  async rotateKey(oldSecretKey: string, newSecretKey: string): Promise<void> {
    const val = await this.getSecret(oldSecretKey);
    if (val) {
      await this.saveSecret(newSecretKey, val);
      await this.deleteSecret(oldSecretKey);
    }
  }
}

export const secretsPlatform = new SecretsPlatform();
export default secretsPlatform;
