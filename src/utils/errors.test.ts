// src/utils/errors.test.ts
// Unit tests for standard PlatformError exception hierarchy

import { describe, it, expect } from "vitest";
import { PlatformError, ValidationError, NotFoundError } from "./errors";

describe("PlatformError", () => {
  it("should generate a correlation ID and correctly format errors", () => {
    const error = new PlatformError("Base exception message", "ERR_CODE_01", 400);

    expect(error.message).toBe("Base exception message");
    expect(error.code).toBe("ERR_CODE_01");
    expect(error.statusCode).toBe(400);
    expect(error.correlationId).toBeDefined();
    expect(error.correlationId.startsWith("err-")).toBe(true);
  });

  it("should build correct ValidationError with fields metadata", () => {
    const fields = { username: "Username must be unique" };
    const error = new ValidationError("Validation failed", fields);

    expect(error.message).toBe("Validation failed");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.statusCode).toBe(400);
    expect(error.context).toEqual(fields);
  });

  it("should build correct NotFoundError", () => {
    const error = new NotFoundError("Resource not found", { resource: "user" });

    expect(error.message).toBe("Resource not found");
    expect(error.code).toBe("NOT_FOUND_ERROR");
    expect(error.statusCode).toBe(404);
    expect(error.context).toEqual({ resource: "user" });
  });
});
