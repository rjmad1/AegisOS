import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

export interface IArtifactProviderAdapter
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "artifact-provider";
  save(key: string, data: Uint8Array, mimeType: string): Promise<string>;
  read(uri: string): Promise<Uint8Array>;
  delete(uri: string): Promise<boolean>;
  exists(uri: string): Promise<boolean>;
}
