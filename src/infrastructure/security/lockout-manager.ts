// src/infrastructure/security/lockout-manager.ts
// Relational SQLite Persistence for Login Lockouts and Brute-Force metrics using Prisma ORM

import prisma from "../db/prisma";

export interface LockoutState {
  attempts: number;
  lockUntil: number;
}

export class LockoutManager {
  private static getKey(ip: string): string {
    return `lockout:${ip}`;
  }

  public static async getLockout(ip: string): Promise<LockoutState> {
    try {
      const record = await prisma.securityState.findUnique({
        where: { key: this.getKey(ip) },
      });
      if (!record) {
        return { attempts: 0, lockUntil: 0 };
      }
      return JSON.parse(record.value) as LockoutState;
    } catch {
      return { attempts: 0, lockUntil: 0 };
    }
  }

  public static async incrementLockout(ip: string): Promise<LockoutState> {
    const current = await this.getLockout(ip);
    const now = Date.now();

    current.attempts++;
    if (current.attempts >= 5) {
      current.lockUntil = now + 15 * 60 * 1000; // 15 minutes lockout
    }

    try {
      await prisma.securityState.upsert({
        where: { key: this.getKey(ip) },
        update: { value: JSON.stringify(current) },
        create: { key: this.getKey(ip), value: JSON.stringify(current) },
      });
    } catch (err: any) {
      console.error("[LockoutManager] Failed to save lockout status:", err.message);
    }

    return current;
  }

  public static async clearLockout(ip: string): Promise<void> {
    try {
      await prisma.securityState.delete({
        where: { key: this.getKey(ip) },
      });
    } catch (e) {}
  }
}

export default LockoutManager;
