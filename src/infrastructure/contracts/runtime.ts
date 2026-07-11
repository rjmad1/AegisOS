import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

export interface IRuntimeProviderAdapter
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "runtime-provider";
  getRuntimeStatus(): Promise<any>;
  listActiveSessions(): Promise<any[]>;
  restartRuntime(): Promise<void>;
}
