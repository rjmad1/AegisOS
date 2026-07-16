import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Blocklist of known-insecure default secrets that must never be used in production
const INSECURE_SECRETS = new Set([
  "super-secret-random-hash-key-for-console-jwt-signing-2026",
  "fallback_secret_must_change_in_production_extremely_long",
  "build-time-placeholder-not-a-real-secret-minimum-length-required-for-compilation",
  "",
]);

let cachedKey: Uint8Array | null = null;

function getKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret || INSECURE_SECRETS.has(authSecret)) {
    throw new Error("FATAL: AUTH_SECRET environment variable is missing or insecure!");
  }
  cachedKey = new TextEncoder().encode(authSecret);
  return cachedKey;
}

export interface AdminUserPayload {
  username: string;
  role: string;
}

export async function getAdminUser(): Promise<AdminUserPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ops_auth_token')?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getKey(), { algorithms: ['HS256'] });
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
