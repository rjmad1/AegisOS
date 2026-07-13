import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const authSecret = process.env.AUTH_SECRET;
if (!authSecret || authSecret === 'super-secret-random-hash-key-for-console-jwt-signing-2026' || authSecret === 'fallback_secret_must_change_in_production_extremely_long') {
  throw new Error("FATAL: AUTH_SECRET environment variable is missing or insecure!");
}
const key = new TextEncoder().encode(authSecret);

export interface AdminUserPayload {
  username: string;
  role: string;
}

export async function getAdminUser(): Promise<AdminUserPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ops_auth_token')?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    const role = payload.role as string;
    const username = payload.username as string || 'admin';

    if (role !== 'Administrator') {
      return null;
    }

    return { username, role };
  } catch (err) {
    return null;
  }
}
