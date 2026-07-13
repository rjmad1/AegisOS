import * as oauth2 from 'oauth4webapi';
import { AuthProvider, AuthUserProfile } from './AuthProvider';

let cachedAuthServer: oauth2.AuthorizationServer | null = null;

export class GoogleProvider implements AuthProvider {
  private issuerUrl = 'https://accounts.google.com';
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private client: oauth2.Client;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.redirectUri = `${appUrl}/api/auth/callback`;
    
    this.client = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      token_endpoint_auth_method: 'client_secret_basic',
    };
  }

  private async getAuthServer(): Promise<oauth2.AuthorizationServer> {
    if (!cachedAuthServer) {
      const issuer = new URL(this.issuerUrl);
      const response = await oauth2.discoveryRequest(issuer, { algorithm: 'oidc' });
      cachedAuthServer = await oauth2.processDiscoveryResponse(issuer, response);
    }
    return cachedAuthServer;
  }

  async getAuthorizationUrl(state: string, nonce: string): Promise<string> {
    const as = await this.getAuthServer();
    const url = new URL(as.authorization_endpoint!);
    url.searchParams.set('client_id', this.client.client_id);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('nonce', nonce);
    return url.href;
  }

  async handleCallback(url: URL, expectedState: string, expectedNonce: string): Promise<AuthUserProfile> {
    const as = await this.getAuthServer();
    
    // validateAuthResponse expects URL or URLSearchParams, throws if error response
    const params = oauth2.validateAuthResponse(as, this.client, url, expectedState);

    const clientAuth = oauth2.ClientSecretBasic(this.clientSecret);
    const response = await oauth2.authorizationCodeGrantRequest(
      as,
      this.client,
      clientAuth,
      params,
      this.redirectUri,
      oauth2.nopkce
    );

    const result = await oauth2.processAuthorizationCodeResponse(as, this.client, response, {
      expectedNonce,
      requireIdToken: true,
    });

    const claims = oauth2.getValidatedIdTokenClaims(result);
    if (!claims) {
      throw new Error('ID Token claims not found in response');
    }

    return {
      id: claims.sub,
      email: claims.email as string,
      name: (claims.name as string) || (claims.email as string),
    };
  }
}

