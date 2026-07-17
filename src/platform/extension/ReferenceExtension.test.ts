// src/platform/extension/ReferenceExtension.test.ts
import { describe, it, expect, vi } from "vitest";
import { ReferenceConsoleNotificationExtension } from "./ReferenceExtension";
import { extensionRegistry } from "./ExtensionFramework";
import { IPluginContext } from "../../api/types/plugins";

describe("ReferenceConsoleNotificationExtension", () => {
  it("should initialize, deliver notification, and shutdown successfully", async () => {
    const extension = new ReferenceConsoleNotificationExtension();

    expect(extension.id).toBe("com.aegisos.extension.console-notification");
    expect(extension.type).toBe("notification-provider");

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
      config: {},
    };

    await extension.initialize(mockContext);
    expect(infoSpy).toHaveBeenCalledWith("Reference Console Notification Extension initialized.");

    // Test notification delivery
    const resultInfo = await extension.deliver("Test Title", "Test Message", "info");
    expect(resultInfo).toBe(true);
    expect(infoSpy).toHaveBeenCalledWith("[Notification Delivery] [INFO] Test Title: Test Message");

    const resultWarn = await extension.deliver("Warning Alert", "Disk is full", "warning");
    expect(resultWarn).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith("[Notification Delivery] [WARNING] Warning Alert: Disk is full");

    const resultError = await extension.deliver("Critical Crash", "Out of memory", "error");
    expect(resultError).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith("[Notification Delivery] [ERROR] Critical Crash: Out of memory");

    await extension.shutdown();
    expect(infoSpy).toHaveBeenCalledWith("Reference Console Notification Extension shutting down.");
  });

  it("should be registerable under standard extension points", () => {
    extensionRegistry.clear();
    extensionRegistry.declareExtensionPoint({
      id: "notification-provider",
      name: "Notification Providers",
    });

    const extension = new ReferenceConsoleNotificationExtension();
    extensionRegistry.registerExtension({
      pointId: "notification-provider",
      extensionId: extension.id,
      implementation: extension,
    });

    const list = extensionRegistry.getExtensions<ReferenceConsoleNotificationExtension>("notification-provider");
    expect(list.length).toBe(1);
    expect(list[0]).toBe(extension);
  });
});
