// tests/unit/security/token-introspector.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT } from 'jose';
import { introspectToken } from '../../../src/platform/auth/token-introspector';

const testSecret = process.env.AUTH_SECRET || 'test-only-auth-secret-not-for-production-use-aaaa-bbbb-cccc-dddd-1234567890';
const secretKey = new TextEncoder().encode(testSecret);

describe('In-Memory Token Introspection Engine', () => {
  it('should reject missing or empty token', async () => {
    const res = await introspectToken({ token: '' });
    expect(res.active).toBe(false);
    expect(res.error).toBe('Missing token');
  });

  it('should reject invalid JWT signature', async () => {
    const res = await introspectToken({ token: 'invalid.jwt.token' });
    expect(res.active).toBe(false);
    expect(res.reason).toBe('Invalid JWT token signature');
  });

  it('should validate valid Administrator token and grant permissions', async () => {
    const token = await new SignJWT({
      username: 'test-admin',
      role: 'Administrator',
      email: 'admin@test.local'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const res = await introspectToken({ token, requiredPermission: 'Administration' });
    expect(res.active).toBe(true);
    expect(res.authorized).toBe(true);
    expect(res.username).toBe('test-admin');
    expect(res.role).toBe('Administrator');
    expect(res.permissions).toContain('Administration');
  });

  it('should deny unauthorized permission request', async () => {
    const token = await new SignJWT({
      username: 'standard-user',
      role: 'Standard User',
      email: 'user@test.local'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const res = await introspectToken({ token, requiredPermission: 'Administration' });
    expect(res.active).toBe(true);
    expect(res.authorized).toBe(false);
    expect(res.reason).toContain('Required permission "Administration" not granted');
  });
});
