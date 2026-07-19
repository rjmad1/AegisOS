import { NextResponse } from 'next/server';
import { getAuthProvider } from '../../../../platform/auth/providers/AuthProvider';
import { adminService } from "@/services/admin.service";
import { sessionService } from '../../../../platform/auth/session.service';
import { cookies } from 'next/headers';
import { auditService } from '../../../../platform/audit/audit.service';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = getAuthProvider();

  
  const cookieStore = await cookies();
  const expectedState = cookieStore.get('oauth_state')?.value;
  const expectedNonce = cookieStore.get('oauth_nonce')?.value;
  
  if (!expectedState || !expectedNonce) {
    return NextResponse.redirect(new URL('/login?error=missing_state', request.url));
  }
  
  try {
    const profile = await provider.handleCallback(url, expectedState, expectedNonce);
    
    // Check Authorization Registry
    let user = await adminService.users.getUserByGoogleId(profile.id);
    if (!user) {
      user = await adminService.users.getUserByEmail(profile.email);
    }
    
    if (!user || user.status !== 'Enabled') {
      await auditService.logEvent({
        eventType: 'Unauthorized Access',
        userEmail: profile.email,
        details: 'User authenticated with Google but is not in the Authorized User Registry or is disabled.'
      });
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    // Link Google ID if only email matched previously
    if (!user.googleSubjectId) {
      user.googleSubjectId = profile.id;
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    await adminService.users.saveUser(user);
    
    // Create Session
    await sessionService.createSession(user.id, user.role);
    
    await auditService.logEvent({
      eventType: 'Login Success',
      userId: user.id,
      userEmail: user.email,
      details: 'User successfully authenticated and authorized.'
    });

    // Clear oauth cookies
    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_nonce');
    
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error: any) {
    console.error('Auth Error', error);
    await auditService.logEvent({
      eventType: 'Login Failure',
      details: `OAuth callback error: ${error.message || 'Unknown error'}`
    });
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }
}
