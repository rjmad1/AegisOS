// src/platform/capability/__tests__/run-tests.ts
// Custom test runner to execute CapabilitySubsystem tests directly via tsx, bypassing native vite/rolldown binding errors.

import * as fs from "fs";
import * as path from "path";

// Mocks for Vitest imports
const beforeEaches: Array<() => Promise<void> | void> = [];
const afterEaches: Array<() => Promise<void> | void> = [];

const globalAny = globalThis as any;

globalAny.describe = (name: string, fn: () => void) => {
  console.log(`\n=== Running Suite: ${name} ===`);
  fn();
};

globalAny.beforeEach = (fn: () => Promise<void> | void) => {
  beforeEaches.push(fn);
};

globalAny.afterEach = (fn: () => Promise<void> | void) => {
  afterEaches.push(fn);
};

globalAny.it = async (name: string, fn: () => Promise<void> | void) => {
  for (const setup of beforeEaches) {
    await setup();
  }
  
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}\n  Error: ${err.message}\n${err.stack}`);
    process.exitCode = 1;
  } finally {
    for (const teardown of afterEaches) {
      await teardown();
    }
  }
};

globalAny.expect = (actual: any) => {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined, but it was undefined`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== "number" || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== "number" || actual < expected) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    },
    toContain(expected: string) {
      if (typeof actual !== "string" || !actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    rejects: {
      async toThrow(expectedSnippet?: string) {
        let threw = false;
        try {
          if (typeof actual === "function") {
            await actual();
          } else {
            await actual;
          }
        } catch (err: any) {
          threw = true;
          if (expectedSnippet && !err.message.includes(expectedSnippet)) {
            throw new Error(`Expected error to contain "${expectedSnippet}", but got "${err.message}"`);
          }
        }
        if (!threw) {
          throw new Error(`Expected function to throw, but it succeeded.`);
        }
      }
    }
  };
};

globalAny.vi = {
  fn: () => {
    const f = () => {};
    return f;
  }
};

// Trigger mock environment
process.env.NODE_ENV = "test";

// Load the tests
import("./CapabilitySubsystem.test")
  .then(() => {
    // Tests are registered dynamically by the import
  })
  .catch(err => {
    console.error("Failed to run tests:", err);
    process.exit(1);
  });
