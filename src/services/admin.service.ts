import { auditRepository } from "@/repositories/audit.repository";
import { secretRepository } from "@/repositories/secret.repository";
import { licenseRepository } from "@/repositories/license.repository";
import { configRepository } from "@/repositories/config.repository";
import { roleRepository } from "@/repositories/role.repository";
import { jobRepository } from "@/repositories/job.repository";
import { featureFlagRepository } from "@/repositories/feature-flag.repository";
import { userRepository } from "@/repositories/user.repository";

export class AdminService {
  public get users() { return userRepository; }
  public get audit() { return auditRepository; }
  public get secrets() { return secretRepository; }
  public get licenses() { return licenseRepository; }
  public get config() { return configRepository; }
  public get roles() { return roleRepository; }
  public get jobs() { return jobRepository; }
  public get featureFlags() { return featureFlagRepository; }
}

export const adminService = new AdminService();
