// tests/unit/security/credential-hygiene.test.ts
// Validates that no hardcoded credentials exist in tracked source files.

import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import path from "path";

const ROOT = path.resolve(__dirname, "../../..");

/**
 * Searches the git-tracked working tree for a pattern, excluding known-safe files.
 * Returns matching file:line entries, or empty array if clean.
 */
function grepTrackedFiles(pattern: string, extraExcludes: string[] = []): string[] {
  const defaultExcludes = [
    ":!node_modules",
    ":!.next",
    ":!package-lock.json",
    ":!automation/ScanSecrets.ps1",       // Scanner references patterns for detection
    ":!src/instrumentation.ts",           // Startup validation references patterns
    ":!src/infrastructure/security/compliance-engine.ts", // Compliance checks patterns
    ":!src/platform/ai-runtime/EvaluationPlatform.ts",    // AI output safety checks
    ":!tests/",                           // Tests themselves may reference patterns
  ];

  const excludes = [...defaultExcludes, ...extraExcludes].join(" ");

  try {
    const result = execSync(
      `git grep -nI "${pattern}" -- ${excludes}`,
      { cwd: ROOT, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    return result.trim().split("\n").filter(Boolean);
  } catch {
    // git grep exits with code 1 when no matches found — that's the success case
    return [];
  }
}

describe("Credential Hygiene — No Hardcoded Secrets in Tracked Files", () => {
  it("should not contain the dev admin password", () => {
    const matches = grepTrackedFiles("DevConsolePassword9023");
    expect(matches, `Found hardcoded password in: ${matches.join(", ")}`).toHaveLength(0);
  });

  it("should not contain dev OAuth client IDs", () => {
    const matches = grepTrackedFiles("google_oauth_client_id_dev_secure_890123");
    expect(matches, `Found dev OAuth ID in: ${matches.join(", ")}`).toHaveLength(0);
  });

  it("should not contain dev OAuth client secrets", () => {
    const matches = grepTrackedFiles("google_oauth_client_secret_dev_secure_890123");
    expect(matches, `Found dev OAuth secret in: ${matches.join(", ")}`).toHaveLength(0);
  });

  it("should not contain dev auth session secrets", () => {
    const matches = grepTrackedFiles("console_jwt_session_auth_secret_dev_secure_120938");
    expect(matches, `Found dev auth secret in: ${matches.join(", ")}`).toHaveLength(0);
  });

  it("should not contain dev JWT encryption keys", () => {
    const matches = grepTrackedFiles("secrets_encryption_key_dev_secure_901283");
    expect(matches, `Found dev JWT key in: ${matches.join(", ")}`).toHaveLength(0);
  });

  it("should not contain dev admin usernames outside test configs", () => {
    const matches = grepTrackedFiles("console_admin_dev");
    expect(matches, `Found dev admin username in: ${matches.join(", ")}`).toHaveLength(0);
  });

  it("should not contain hardcoded Vault root tokens", () => {
    const matches = grepTrackedFiles("VAULT_TOKEN.*root");
    expect(matches, `Found root Vault token in: ${matches.join(", ")}`).toHaveLength(0);
  });
});
