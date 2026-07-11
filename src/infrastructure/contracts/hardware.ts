import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

export interface IHardwareProviderAdapter
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "hardware-provider";
  getTelemetry(): Promise<any>;
  getSystemInfo(): Promise<any>;
  checkGpuAvailability(): Promise<boolean>;
}
