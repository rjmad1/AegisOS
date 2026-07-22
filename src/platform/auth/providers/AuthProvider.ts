export interface AuthUserProfile {
  id: string;
  email: string;
  name: string;
  roles?: string[];
}

export interface AuthProvider {
  /**
   * Generates the authorization URL to redirect the user to the provider.
   * @param state A random string to prevent CSRF attacks.
   * @param nonce A random string to associate a client session with an ID Token, and to mitigate replay attacks.
   */
  getAuthorizationUrl(state: string, nonce: string): Promise<string>;

  /**
   * Handles the callback from the identity provider and returns the authenticated user profile.
   * @param url The full callback URL containing the authorization code and state.
   * @param expectedState The state string that was passed to getAuthorizationUrl.
   * @param expectedNonce The nonce string that was passed to getAuthorizationUrl.
   */
  handleCallback(url: URL, expectedState: string, expectedNonce: string): Promise<AuthUserProfile>;
}

import { GoogleProvider } from './GoogleProvider';
import { EntraProvider } from './EntraProvider';
import { LdapProvider } from './LdapProvider';
import { OktaProvider } from './OktaProvider';
import { KeycloakProvider } from './KeycloakProvider';
import { SamlProvider } from './SamlProvider';

export function getAuthProvider(): AuthProvider {
  const providerType = process.env.AUTH_PROVIDER || 'google';
  if (providerType === 'entra') {
    return new EntraProvider();
  }
  if (providerType === 'ldap') {
    return new LdapProvider();
  }
  if (providerType === 'okta') {
    return new OktaProvider();
  }
  if (providerType === 'keycloak') {
    return new KeycloakProvider();
  }
  if (providerType === 'saml') {
    return new SamlProvider();
  }
  return new GoogleProvider();
}

