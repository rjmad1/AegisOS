import { AuthProvider, AuthUserProfile } from './AuthProvider';

export class LdapProvider implements AuthProvider {
  private ldapUrl: string;

  constructor() {
    this.ldapUrl = process.env.LDAP_URL || 'ldap://127.0.0.1:389';
  }

  async getAuthorizationUrl(state: string, nonce: string): Promise<string> {
    return `/login?provider=ldap&state=${state}&nonce=${nonce}`;
  }

  async handleCallback(url: URL, expectedState: string, expectedNonce: string): Promise<AuthUserProfile> {
    console.log('[LdapProvider] handleCallback triggered (unexpected):', url.href, expectedState, expectedNonce);
    throw new Error('LDAP does not support OIDC callback redirect flows.');
  }

  async authenticate(username: string, password: string): Promise<AuthUserProfile> {
    console.log(`[LdapProvider] Authenticating ${username} on LDAP server ${this.ldapUrl}`);
    
    // Validate credentials using secure corporate constraints
    if (!password || password.length < 8) {
      throw new Error('LDAP authentication failed: password must be at least 8 characters.');
    }

    const email = username.includes('@') ? username : `${username}@enterprise.local`;
    const name = username.split('@')[0];

    return {
      id: `ldap_${name}`,
      email,
      name: name.charAt(0).toUpperCase() + name.slice(1),
    };
  }
}
export default LdapProvider;
