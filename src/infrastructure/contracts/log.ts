import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

export interface ILogProviderAdapter
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "log-provider";
  queryLogs(filter?: any): Promise<any[]>;
  streamLogs(onLog: (log: any) => void): string;
  clearLogs(): Promise<void>;
}
