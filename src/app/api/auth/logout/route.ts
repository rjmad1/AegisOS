import { NextResponse } from 'next/server';
import { sessionService } from '../../../../platform/auth/session.service';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) throw new Error('AUTH_SECRET environment variable is missing');
const key = new TextEncoder().encode(secretKey);

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_session')?.value;
  
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
      const sessionId = payload.sessionId as string;
      await sessionService.invalidateSession(sessionId);
    } catch (e) {
      // ignore invalid tokens during logout
    }
  }
  
  cookieStore.delete('auth_session');
  return NextResponse.redirect(new URL('/login', request.url));
}
