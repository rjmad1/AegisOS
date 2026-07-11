import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

export interface IFileProviderAdapter
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "file-provider";
  listDirectory(path: string): Promise<any[]>;
  createFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  getFileStats(path: string): Promise<any>;
}
