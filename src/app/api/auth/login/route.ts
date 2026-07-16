import { NextResponse } from 'next/server';
import { getAuthProvider } from '../../../../platform/auth/providers/AuthProvider';
import { userRepository } from '../../../../repositories/user.repository';
import { sessionService } from '../../../../platform/auth/session.service';
import { auditService } from '../../../../platform/audit/audit.service';
import { Role, Permission, AuthorizedUser } from '../../../../platform/auth/authorization';
import { AuthUserProfile } from '../../../../platform/auth/providers/AuthProvider';
import * as oauth2 from 'oauth4webapi';
import { cookies } from 'next/headers';

export async function GET() {
  const provider = getAuthProvider();
  const state = oauth2.generateRandomState();
  const nonce = oauth2.generateRandomNonce();
  
  const authUrl = await provider.getAuthorizationUrl(state, nonce);
  
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 10, path: '/' });
  cookieStore.set('oauth_nonce', nonce, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 10, path: '/' });
  
  return NextResponse.redirect(authUrl);
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const provider = getAuthProvider();
    
    // Type-safe check for credentials provider
    const isCredentialsProvider = 'authenticate' in provider && 
      typeof (provider as unknown as { authenticate: unknown }).authenticate === 'function';

    if (!isCredentialsProvider) {
      return NextResponse.json({ error: 'Selected authentication provider does not support username/password authentication.' }, { status: 400 });
    }
    
    const credentialsProvider = provider as unknown as { authenticate: (u: string, p: string) => Promise<AuthUserProfile> };
    const profile = await credentialsProvider.authenticate(username, password);
    
    // Validate user in repository
    let user = await userRepository.getUserByEmail(profile.email);
    if (!user) {
      // Auto-create a Viewer user for authenticated LDAP users if not in registry
      const newUser: AuthorizedUser = {
        id: profile.id,
        googleSubjectId: 'ldap_' + profile.id,
        email: profile.email,
        displayName: profile.name,
        role: Role.Viewer,
        status: 'Enabled',
        createdDate: new Date().toISOString(),
        lastLogin: null,
        createdBy: 'ldap-sync',
        permissions: [Permission.ViewRuntime, Permission.ViewArtifacts],
        allowedNetworks: [],
        notes: 'Auto-provisioned via LDAP bind authentication'
      };
      await userRepository.saveUser(newUser);
      user = newUser;
    }

    if (user.status !== 'Enabled') {
      await auditService.logEvent({
        eventType: 'Unauthorized Access',
        userEmail: profile.email,
        details: 'User authenticated via LDAP but status is Disabled in registry.'
      });
      return NextResponse.json({ error: 'Your account is disabled.' }, { status: 403 });
    }

    user.lastLogin = new Date().toISOString();
    await userRepository.saveUser(user);

    // Create session
    await sessionService.createSession(user.id, user.role);

    await auditService.logEvent({
      eventType: 'Login Success',
      userId: user.id,
      userEmail: user.email,
      details: 'User successfully authenticated and authorized via LDAP.'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('LDAP Auth Error', error);
    await auditService.logEvent({
      eventType: 'Login Failure',
      details: `LDAP authentication failure: ${errorMsg}`
    });
    return NextResponse.json({ error: errorMsg }, { status: 401 });
  }
}
