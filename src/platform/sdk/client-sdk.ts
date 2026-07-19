import { allModules } from "@/platform/kernel/boot";
import { ModuleRegistry } from "@/platform/module-registry/ModuleRegistry";

export const clientPlatformSdk = {
  /**
   * Register modules synchronously on the client so that initial render of Navigation groups works.
   * This facade protects the UI layer from directly importing kernel components.
   */
  bootModules: () => {
    allModules.forEach(mod => ModuleRegistry.register(mod));
  }
};
