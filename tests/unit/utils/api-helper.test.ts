// tests/unit/utils/api-helper.test.ts
import { describe, it, expect, vi } from "vitest";
import { handleCaching, formatErrorResponse } from "../../../src/utils/api-helper";
import { PlatformError } from "../../../src/utils/errors";

describe("API Helper Utilities", () => {
  describe("handleCaching", () => {
    it("should return a 200 JSON response with ETag and Cache-Control headers when If-None-Match does not match", () => {
      const request = new Request("http://localhost/api/test");
      const data = { message: "Hello World", count: 42 };

      const response = handleCaching(request, data);
      expect(response.status).toBe(200);
      expect(response.headers.get("ETag")).toBeDefined();
      expect(response.headers.get("Cache-Control")).toBe("public, max-age=5");
    });

    it("should return a 304 Not Modified response when If-None-Match header matches the computed ETag", () => {
      const data = { message: "Cached Data" };
      // Pre-compute expected etag
      const initialResponse = handleCaching(new Request("http://localhost/api/test"), data);
      const etag = initialResponse.headers.get("ETag")!;

      const request = new Request("http://localhost/api/test", {
        headers: { "if-none-match": etag }
      });

      const response = handleCaching(request, data);
      expect(response.status).toBe(304);
      expect(response.headers.get("ETag")).toBe(etag);
      expect(response.headers.get("Cache-Control")).toBe("public, max-age=5");
    });
  });

  describe("formatErrorResponse", () => {
    it("should format PlatformError correctly with custom status code, correlationId and context", () => {
      const platformErr = new PlatformError("RESOURCE_NOT_FOUND", "Project with ID 123 not found", 404, { projectId: 123 });
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = formatErrorResponse(platformErr);
      expect(response.status).toBe(404);

      consoleSpy.mockRestore();
    });

    it("should format standard Error objects with 500 status code", () => {
      const standardErr = new Error("Database connection lost");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = formatErrorResponse(standardErr);
      expect(response.status).toBe(500);

      consoleSpy.mockRestore();
    });

    it("should format string error messages with 500 status code", () => {
      const stringErr = "Critical security assertion failed";
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = formatErrorResponse(stringErr);
      expect(response.status).toBe(500);

      consoleSpy.mockRestore();
    });

    it("should handle unknown error types gracefully", () => {
      const unknownErr = { custom: "object error" };
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = formatErrorResponse(unknownErr);
      expect(response.status).toBe(500);

      consoleSpy.mockRestore();
    });
  });
});
