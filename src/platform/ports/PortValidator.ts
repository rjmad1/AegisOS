// src/platform/ports/PortValidator.ts
// Performs startup validation checks to ensure no duplicate ports or invalid mappings exist.

import { PortRegistry } from "./PortRegistry";
import * as fs from "fs";
import * as path from "path";

export class PortValidator {
  public static validate(): void {
    const registryPath = path.resolve(process.cwd(), "configs/ports.json");
    if (!fs.existsSync(registryPath)) {
      console.warn("[PortValidator] Registry configs/ports.json is missing. Bypassing validation.");
      return;
    }

    try {
      const content = fs.readFileSync(registryPath, "utf-8");
      const registry = JSON.parse(content);
      const services = Object.keys(registry);

      const resolvedPorts: Record<number, string[]> = {};
      const diagnostics: Array<{ service: string; defaultPort: number; resolvedPort: number; status: string }> = [];
      let hasError = false;

      for (const serviceName of services) {
        const service = registry[serviceName];
        const defaultPort = service.default_host_port;
        const resolvedPort = PortRegistry.getHostPort(serviceName);

        // 1. Validate range bounds
        if (resolvedPort < 1 || resolvedPort > 65535) {
          diagnostics.push({ service: serviceName, defaultPort, resolvedPort, status: "ERROR: Port out of bounds (1-65535)" });
          hasError = true;
          continue;
        }

        // 2. Check for duplicate resolved port assignments
        if (resolvedPorts[resolvedPort]) {
          resolvedPorts[resolvedPort].push(serviceName);
          hasError = true;
        } else {
          resolvedPorts[resolvedPort] = [serviceName];
        }

        diagnostics.push({ service: serviceName, defaultPort, resolvedPort, status: "OK" });
      }

      // Format diagnostics for duplicate assignments
      for (const portStr of Object.keys(resolvedPorts)) {
        const port = parseInt(portStr, 10);
        const mapped = resolvedPorts[port];
        if (mapped.length > 1) {
          for (const sName of mapped) {
            const index = diagnostics.findIndex(d => d.service === sName);
            if (index >= 0) {
              diagnostics[index].status = `ERROR: Duplicate assignment on port ${port} shared with: ${mapped.filter(n => n !== sName).join(", ")}`;
            }
          }
        }
      }

      if (hasError) {
        console.error("\n======================================================================");
        console.error("               PORT VALIDATION FAILURE — SYSTEM HALTED               ");
        console.error("======================================================================");
        console.error("Service".padEnd(20) + " | " + "Default".padEnd(8) + " | " + "Resolved".padEnd(8) + " | Status");
        console.error("-".repeat(70));
        for (const row of diagnostics) {
          console.error(
            row.service.padEnd(20) + " | " +
            String(row.defaultPort).padEnd(8) + " | " +
            String(row.resolvedPort).padEnd(8) + " | " +
            row.status
          );
        }
        console.error("======================================================================\n");
        throw new Error("FATAL: Port configuration validation failed. Duplicate or invalid host ports detected!");
      }

      console.log("[PortValidator] Startup validation passed successfully. No conflicts found.");
    } catch (e: any) {
      console.error("[PortValidator] Fatal validation exception:", e.message);
      throw e;
    }
  }
}
