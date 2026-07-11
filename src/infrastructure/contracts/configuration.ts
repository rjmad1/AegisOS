import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

export interface IConfigurationProviderAdapter
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "configuration-provider";
  getConfiguration(): Promise<any>;
  updateConfiguration(config: any): Promise<void>;
  getServicesMeta(): Promise<any>;
}
