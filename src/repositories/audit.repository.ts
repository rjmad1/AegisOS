// src/repositories/audit.repository.ts
// Relational SQLite Persistence for Administrative Audit Logs using Prisma ORM

import prisma from "../infrastructure/db/prisma";
import { EventBus } from "../platform/event-bus/EventBus";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  category: "authentication" | "authorization" | "configuration" | "provider" | "deployment" | "security" | "administration";
  details: string;
  ipAddress: string;
}

export class AuditRepository {
  async getAllLogs(): Promise<AuditLogEntry[]> {
    const records = await prisma.auditLogEntry.findMany({
      orderBy: { timestamp: "desc" },
    });
    return records.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      userId: r.userId,
      action: r.action,
      category: r.category as any,
      details: r.details,
      ipAddress: r.ipAddress,
    }));
  }

  async logEvent(
    userId: string,
    action: string,
    category: AuditLogEntry["category"],
    details: string,
    ipAddress: string = "127.0.0.1"
  ): Promise<AuditLogEntry> {
    const id = `aud-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const entry: AuditLogEntry = {
      id,
      timestamp,
      userId,
      action,
      category,
      details,
      ipAddress,
    };

    // Transactionally create audit entry and maintain retention limit (last 5000 logs)
    await prisma.$transaction(async (tx) => {
      await tx.auditLogEntry.create({
        data: {
          id,
          timestamp,
          userId,
          action,
          category,
          details,
          ipAddress,
        },
      });

      // Simple retention clean: remove logs outside of the 5000 limit
      const count = await tx.auditLogEntry.count();
      if (count > 5000) {
        const oldestToKeep = await tx.auditLogEntry.findMany({
          orderBy: { timestamp: "desc" },
          take: 5000,
          select: { id: true },
        });
        const idsToKeep = oldestToKeep.map((o) => o.id);
        await tx.auditLogEntry.deleteMany({
          where: {
            id: { notIn: idsToKeep },
          },
        });
      }
    });

    // Publish audit event to event bus
    EventBus.publish("audit:logged", entry);

    return entry;
  }

  async getLogs(filters?: {
    query?: string;
    category?: AuditLogEntry["category"];
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogEntry[]> {
    const whereClause: any = {};

    if (filters) {
      if (filters.category) {
        whereClause.category = filters.category;
      }
      if (filters.startDate || filters.endDate) {
        whereClause.timestamp = {};
        if (filters.startDate) {
          whereClause.timestamp.gte = filters.startDate;
        }
        if (filters.endDate) {
          whereClause.timestamp.lte = filters.endDate;
        }
      }
      if (filters.query) {
        const q = filters.query;
        whereClause.OR = [
          { action: { contains: q } },
          { details: { contains: q } },
          { userId: { contains: q } },
          { ipAddress: { contains: q } },
        ];
      }
    }

    const records = await prisma.auditLogEntry.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" },
    });

    return records.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      userId: r.userId,
      action: r.action,
      category: r.category as any,
      details: r.details,
      ipAddress: r.ipAddress,
    }));
  }
}

export const auditRepository = new AuditRepository();
export default auditRepository;
