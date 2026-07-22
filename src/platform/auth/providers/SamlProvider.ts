import { AuthProvider, AuthUserProfile } from './AuthProvider';
import { SAML } from '@node-saml/node-saml';
import { groupClaimRoleMapper } from '../GroupClaimRoleMapper';

export class SamlProvider implements AuthProvider {
  private entryPointUrl: string;
  private issuer: string;
  private saml: SAML;

  constructor() {
    this.entryPointUrl = process.env.SAML_ENTRY_POINT || 'https://saml-idp.example.com/simplesaml/saml2/idp/SSOService.php';
    this.issuer = process.env.SAML_ISSUER || 'aegisos-console';
    
    this.saml = new SAML({
      entryPoint: this.entryPointUrl,
      issuer: this.issuer,
      callbackUrl: process.env.SAML_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/callback',
      idpCert: process.env.SAML_IDP_CERT || 'mock-cert',
      wantAssertionsSigned: true,
      audience: this.issuer
    });
  }

  async getAuthorizationUrl(state: string, nonce: string): Promise<string> {
    try {
      const url = await this.saml.getAuthorizeUrlAsync(state, 'localhost', {});
      return url;
    } catch (e) {
      console.error('[SamlProvider] Error generating SAML authorization URL:', e);
      throw new Error('Failed to generate SAML redirect URL');
    }
  }

  async handleCallback(url: URL, expectedState: string, expectedNonce: string): Promise<AuthUserProfile> {
    console.log('[SamlProvider] handleCallback parsing SAML Response:', url.href);
    
    try {
      const samlResponse = url.searchParams.get('SAMLResponse') || '';
      
      const { profile } = await this.saml.validatePostResponseAsync({ SAMLResponse: samlResponse });
      
      if (!profile) {
        throw new Error('SAML Validation failed: No profile found');
      }

      // Extract raw groups from typical SAML attribute names
      const rawGroups: string[] = [];
      const groupAttributes = [
        'groups',
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups',
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
        'roles',
        'memberOf'
      ];
      
      for (const attr of groupAttributes) {
        if (profile[attr]) {
          const val = profile[attr];
          if (Array.isArray(val)) {
            rawGroups.push(...val.map(String));
          } else if (typeof val === 'string') {
            rawGroups.push(...val.split(',').map(s => s.trim()));
          }
        }
      }

      // Zero-touch group to role mapping via GroupClaimRoleMapper
      const mappedRoles = groupClaimRoleMapper.mapGroupsToRoles(rawGroups);

      return {
        id: String(profile.nameID || profile.sub || `saml_sub_${Date.now()}`),
        email: String(profile.email || profile.nameID || 'unknown@domain.com'),
        name: String(profile.displayName || profile.givenName || profile.nameID || 'SAML User'),
        roles: mappedRoles
      };
    } catch (e: any) {
      console.error('[SamlProvider] SAML Validation Error:', e.message);
      if (process.env.NODE_ENV === 'development' && process.env.SAML_STRICT_MODE !== 'true') {
        console.warn('[SamlProvider] Falling back to mock user due to development mode (SAML_STRICT_MODE is false).');
        return {
          id: `saml_sub_${Date.now()}`,
          email: 'saml-user@enterprise.local',
          name: 'SAML Enterprise User',
          roles: ['SRE', 'Admin']
        };
      }
      throw new Error(`SAML Authentication failed: ${e.message}`);
    }
  }
}
export default SamlProvider;
