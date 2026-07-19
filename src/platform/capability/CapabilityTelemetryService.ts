import { ICapabilityTelemetry, CapabilityEvent } from "./types";
import { TenantContext } from "../core/storage/types";

export class CapabilityTelemetryService implements ICapabilityTelemetry {
  public async recordEvent(event: CapabilityEvent, context: TenantContext): Promise<void> {
    // Stub
  }
}
