// src/instrumentation.ts
// Bootstraps backend services when Next.js starts up

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[Instrumentation] Starting server-side Platform Kernel boot sequence...");
    try {
      // 1. Enforce secure credentials and fail boot on insecure keys or defaults
      const authSecret = process.env.AUTH_SECRET;
      const opsJwtSecret = process.env.OPS_JWT_SECRET;
      const expectedUsername = process.env.OPS_ADMIN_USERNAME;
      const expectedPassword = process.env.OPS_ADMIN_PASSWORD;
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

      const fallbacks = [
        "super-secret-random-hash-key-for-console-jwt-signing-2026",
        "fallback_secret_must_change_in_production_extremely_long",
        "a_very_long_secure_random_string_for_encrypting_sessions",
        "admin",
        "AdminPassword123!",
        "your_google_client_id_here",
        "your_google_client_secret_here",
        "production_google_client_id",
        "production_google_client_secret"
      ];

      if (!authSecret || fallbacks.includes(authSecret)) {
        throw new Error("FATAL: AUTH_SECRET environment variable is missing or insecure!");
      }
      if (!opsJwtSecret || fallbacks.includes(opsJwtSecret)) {
        throw new Error("FATAL: OPS_JWT_SECRET environment variable is missing or insecure!");
      }
      if (!expectedUsername || fallbacks.includes(expectedUsername)) {
        throw new Error("FATAL: OPS_ADMIN_USERNAME environment variable is missing or insecure!");
      }
      if (!expectedPassword || fallbacks.includes(expectedPassword)) {
        throw new Error("FATAL: OPS_ADMIN_PASSWORD environment variable is missing or insecure!");
      }
      if (!googleClientId || fallbacks.includes(googleClientId)) {
        throw new Error("FATAL: GOOGLE_CLIENT_ID environment variable is missing or insecure!");
      }
      if (!googleClientSecret || fallbacks.includes(googleClientSecret)) {
        throw new Error("FATAL: GOOGLE_CLIENT_SECRET environment variable is missing or insecure!");
      }

      // 2. Bootstrap the database and migrate legacy JSON configurations
      const { bootstrapDatabase } = await import("@/infrastructure/db/db-migrator");
      await bootstrapDatabase();

      const { workflowService } = await import("@/services/workflow.service");
      await workflowService.start();
      console.log("[Instrumentation] Server-side Workflow Engine background service initialized.");
    } catch (err: any) {
      console.error("[Instrumentation] Server-side initialization error during register():", err.message);
      process.exit(1); // Force server to exit as per EDRB instructions
    }
  }
}
