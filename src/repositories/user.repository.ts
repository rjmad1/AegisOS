// src/repositories/user.repository.ts
// Relational SQLite Persistence for Authorized Users using Prisma ORM

import prisma from "../infrastructure/db/prisma";
import { AuthorizedUser, Role } from "../platform/auth/authorization";

export class UserRepository {
  async getAllUsers(): Promise<AuthorizedUser[]> {
    const records = await prisma.user.findMany({
      where: { deletedAt: null },
    });
    return records.map((r) => ({
      id: r.id,
      googleSubjectId: r.googleSubjectId,
      email: r.email,
      displayName: r.displayName,
      role: r.role as Role,
      status: r.status as "Enabled" | "Disabled",
      createdDate: r.createdDate,
      lastLogin: r.lastLogin,
      createdBy: r.createdBy,
      permissions: JSON.parse(r.permissions),
      allowedNetworks: JSON.parse(r.allowedNetworks),
      notes: r.notes,
    }));
  }

  async getUserByEmail(email: string): Promise<AuthorizedUser | undefined> {
    const record = await prisma.user.findFirst({
      where: {
        email: email,
        deletedAt: null,
      },
    });
    if (!record) return undefined;
    return {
      id: record.id,
      googleSubjectId: record.googleSubjectId,
      email: record.email,
      displayName: record.displayName,
      role: record.role as Role,
      status: record.status as "Enabled" | "Disabled",
      createdDate: record.createdDate,
      lastLogin: record.lastLogin,
      createdBy: record.createdBy,
      permissions: JSON.parse(record.permissions),
      allowedNetworks: JSON.parse(record.allowedNetworks),
      notes: record.notes,
    };
  }

  async getUserByGoogleId(googleId: string): Promise<AuthorizedUser | undefined> {
    const record = await prisma.user.findFirst({
      where: { googleSubjectId: googleId, deletedAt: null },
    });
    if (!record) return undefined;
    return {
      id: record.id,
      googleSubjectId: record.googleSubjectId,
      email: record.email,
      displayName: record.displayName,
      role: record.role as Role,
      status: record.status as "Enabled" | "Disabled",
      createdDate: record.createdDate,
      lastLogin: record.lastLogin,
      createdBy: record.createdBy,
      permissions: JSON.parse(record.permissions),
      allowedNetworks: JSON.parse(record.allowedNetworks),
      notes: record.notes,
    };
  }

  async getUserById(id: string): Promise<AuthorizedUser | undefined> {
    const record = await prisma.user.findUnique({
      where: { id },
    });
    if (!record || record.deletedAt) return undefined;
    return {
      id: record.id,
      googleSubjectId: record.googleSubjectId,
      email: record.email,
      displayName: record.displayName,
      role: record.role as Role,
      status: record.status as "Enabled" | "Disabled",
      createdDate: record.createdDate,
      lastLogin: record.lastLogin,
      createdBy: record.createdBy,
      permissions: JSON.parse(record.permissions),
      allowedNetworks: JSON.parse(record.allowedNetworks),
      notes: record.notes,
    };
  }

  async saveUser(user: AuthorizedUser): Promise<void> {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        googleSubjectId: user.googleSubjectId,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        createdDate: user.createdDate,
        lastLogin: user.lastLogin,
        createdBy: user.createdBy,
        permissions: JSON.stringify(user.permissions || []),
        allowedNetworks: JSON.stringify(user.allowedNetworks || []),
        notes: user.notes || "",
      },
      create: {
        id: user.id,
        googleSubjectId: user.googleSubjectId,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        createdDate: user.createdDate,
        lastLogin: user.lastLogin,
        createdBy: user.createdBy,
        permissions: JSON.stringify(user.permissions || []),
        allowedNetworks: JSON.stringify(user.allowedNetworks || []),
        notes: user.notes || "",
      },
    });
  }

  async deleteUser(id: string): Promise<void> {
    // Soft delete support as required by EDRB
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const userRepository = new UserRepository();
