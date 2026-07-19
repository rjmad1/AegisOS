// src/platform/capability/__tests__/run-tests.ts
// Custom test runner to execute CapabilitySubsystem tests sequentially, avoiding database lock concurrency.

import * as fs from "fs";
import * as path from "path";

// Mocks for Vitest imports
const beforeEaches: Array<() => Promise<void> | void> = [];
const afterEaches: Array<() => Promise<void> | void> = [];
const tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];

const globalAny = globalThis as any;

globalAny.describe = (name: string, fn: () => void) => {
  console.log(`\n=== Registering Suite: ${name} ===`);
  fn();
};

globalAny.beforeEach = (fn: () => Promise<void> | void) => {
  beforeEaches.push(fn);
};

globalAny.afterEach = (fn: () => Promise<void> | void) => {
  afterEaches.push(fn);
};

globalAny.it = (name: string, fn: () => Promise<void> | void) => {
  tests.push({ name, fn });
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

// Trigger mock environment BEFORE imports happen
process.env.NODE_ENV = "test";
process.env.AEGISOS_STATE_DIR = path.resolve(__dirname, "../../../../../test-state");

// Load the tests and run them sequentially
import("./CapabilitySubsystem.test")
  .then(async () => {
    console.log(`\nFound ${tests.length} tests. Running sequentially...`);
    
    for (const test of tests) {
      console.log(`\n[Test:Start] ${test.name}`);
      
      // Run setups
      for (const setup of beforeEaches) {
        await setup();
      }

      try {
        await test.fn();
        console.log(`  ✓ PASS: ${test.name}`);
      } catch (err: any) {
        console.error(`  ✗ FAIL: ${test.name}\n  Error: ${err.message}\n${err.stack}`);
        process.exitCode = 1;
      } finally {
        // Run teardowns
        for (const teardown of afterEaches) {
          await teardown();
        }
      }
    }
    
    console.log("\n=== Test Execution Completed ===");
    process.exit(process.exitCode || 0);
  })
  .catch(err => {
    console.error("Failed to run tests:", err);
    process.exit(1);
  });
