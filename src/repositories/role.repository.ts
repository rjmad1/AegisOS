// src/repositories/role.repository.ts
// Relational SQLite Persistence for Role Permissions using Prisma ORM

import prisma from "../infrastructure/db/prisma";
import { Role, Permission } from "../platform/auth/authorization";

export class RoleRepository {
  async getRolePermissions(): Promise<Record<Role, Permission[]>> {
    const records = await prisma.rolePermission.findMany();
    const result: Record<string, Permission[]> = {};
    for (const r of records) {
      result[r.role] = JSON.parse(r.permissions) as Permission[];
    }
    return result as Record<Role, Permission[]>;
  }

  async saveRolePermissions(role: Role, permissions: Permission[]): Promise<void> {
    await prisma.rolePermission.upsert({
      where: { role },
      update: {
        permissions: JSON.stringify(permissions),
      },
      create: {
        role,
        permissions: JSON.stringify(permissions),
      },
    });
  }
}

export const roleRepository = new RoleRepository();
export default roleRepository;
