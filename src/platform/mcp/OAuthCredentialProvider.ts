import crypto from 'crypto';
import { logger } from '../../infrastructure/observability/structured-logger';

export interface OAuthTokenData {
  userId: string;
  providerId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType?: string;
  scopes: string[];
  metadata?: Record<string, unknown>;
}

export interface OAuthProviderConfig {
  providerId: string;
  clientId: string;
  clientSecret?: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

/**
 * OAuthCredentialProvider handles local PKCE OAuth flows, AES-256 encrypted token vaulting,
 * and automatic background token refresh for enterprise SaaS connectors in AegisOS.
 */
export class OAuthCredentialProvider {
  private masterKey: Buffer;

  constructor(secretKey?: string) {
    const rawKey = secretKey || process.env.AEGIS_MASTER_ENCRYPTION_KEY || 'aegisos-default-local-master-vault-key-32b';
    // Ensure key length is exactly 32 bytes for AES-256
    this.masterKey = crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypt plaintext string using AES-256-GCM
   */
  public encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt AES-256-GCM encrypted payload
   */
  public decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format.');
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Generates a PKCE code verifier and challenge pair for local-first OAuth authorization
   */
  public generatePkcePair(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  /**
   * Constructs authorization URL for standard OAuth 2.0 PKCE flow
   */
  public buildAuthorizationUrl(config: OAuthProviderConfig, state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    return `${config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Prepares encrypted storage payload for User OAuth Tokens
   */
  public prepareTokenVaultRecord(tokenData: OAuthTokenData): {
    userId: string;
    providerId: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
    tokenType: string;
    scopes: string;
    metadata: string | null;
  } {
    logger.info(`Vaulting encrypted OAuth credentials for User ${tokenData.userId} / Provider ${tokenData.providerId}`);
    return {
      userId: tokenData.userId,
      providerId: tokenData.providerId,
      accessToken: this.encrypt(tokenData.accessToken),
      refreshToken: tokenData.refreshToken ? this.encrypt(tokenData.refreshToken) : null,
      expiresAt: tokenData.expiresAt || null,
      tokenType: tokenData.tokenType || 'Bearer',
      scopes: JSON.stringify(tokenData.scopes),
      metadata: tokenData.metadata ? JSON.stringify(tokenData.metadata) : null,
    };
  }

  /**
   * Decrypts vaulted token record for runtime usage
   */
  public decryptTokenVaultRecord(record: {
    accessToken: string;
    refreshToken: string | null;
    scopes: string;
  }): {
    accessToken: string;
    refreshToken?: string;
    scopes: string[];
  } {
    return {
      accessToken: this.decrypt(record.accessToken),
      refreshToken: record.refreshToken ? this.decrypt(record.refreshToken) : undefined,
      scopes: JSON.parse(record.scopes || '[]'),
    };
  }
}
