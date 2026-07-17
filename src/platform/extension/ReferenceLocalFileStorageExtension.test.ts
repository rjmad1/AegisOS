// src/platform/extension/ReferenceLocalFileStorageExtension.test.ts
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { ReferenceLocalFileStorageExtension } from "./ReferenceLocalFileStorageExtension";
import { extensionRegistry } from "./ExtensionFramework";
import { IPluginContext } from "../../api/types/plugins";
import * as fs from "fs/promises";
import * as path from "path";
import { Readable } from "stream";

const TEST_STORAGE_DIR = path.join(process.cwd(), "temp_reference_storage_test");

describe("ReferenceLocalFileStorageExtension", () => {
  const infoSpy = vi.fn();
  const warnSpy = vi.fn();
  const errorSpy = vi.fn();

  const mockContext: IPluginContext = {
    eventBus: {} as any,
    search: {} as any,
    notifications: {} as any,
    logger: {
      info: infoSpy,
      warn: warnSpy,
      error: errorSpy,
    },
    config: {
      storageDir: TEST_STORAGE_DIR,
    },
  };

  beforeAll(async () => {
    await fs.mkdir(TEST_STORAGE_DIR, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(TEST_STORAGE_DIR, { recursive: true, force: true });
  });

  it("should initialize, save, check, read, delete, and shutdown successfully", async () => {
    const extension = new ReferenceLocalFileStorageExtension();

    expect(extension.id).toBe("com.aegisos.extension.local-file-storage");
    expect(extension.type).toBe("storage-provider");
    expect(extension.scheme).toBe("local");

    await extension.initialize(mockContext);
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("Reference Local File Storage Extension initialized."));

    const key = "test-doc.txt";
    const content = new TextEncoder().encode("Hello AegisOS Local Storage!");
    
    // Save
    const uri = await extension.save(key, content, "text/plain");
    expect(uri).toBe("local://test-doc.txt");

    // Exists
    const existsBefore = await extension.exists(uri);
    expect(existsBefore).toBe(true);

    // Read
    const readContent = await extension.read(uri);
    expect(new TextDecoder().decode(readContent)).toBe("Hello AegisOS Local Storage!");

    // Delete
    const deleted = await extension.delete(uri);
    expect(deleted).toBe(true);

    // Exists post-delete
    const existsAfter = await extension.exists(uri);
    expect(existsAfter).toBe(false);

    await extension.shutdown();
    expect(infoSpy).toHaveBeenCalledWith("Reference Local File Storage Extension shutting down.");
  });

  it("should support streams in save function", async () => {
    const extension = new ReferenceLocalFileStorageExtension();
    await extension.initialize(mockContext);

    // Create a simple Readable stream
    const dataStream = new Readable();
    dataStream.push("Streaming data content");
    dataStream.push(null);

    const uri = await extension.save("stream-doc.txt", dataStream, "text/plain");
    expect(uri).toBe("local://stream-doc.txt");

    const readContent = await extension.read(uri);
    expect(new TextDecoder().decode(readContent)).toBe("Streaming data content");

    await extension.delete(uri);
  });

  it("should be registerable under standard extension points", () => {
    extensionRegistry.clear();
    extensionRegistry.declareExtensionPoint({
      id: "storage-provider",
      name: "Storage Providers",
    });

    const extension = new ReferenceLocalFileStorageExtension();
    extensionRegistry.registerExtension({
      pointId: "storage-provider",
      extensionId: extension.id,
      implementation: extension,
    });

    const list = extensionRegistry.getExtensions<ReferenceLocalFileStorageExtension>("storage-provider");
    expect(list.length).toBe(1);
    expect(list[0]).toBe(extension);
  });
});
