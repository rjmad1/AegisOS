import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

export interface IJobProviderAdapter
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "job-provider";
  enqueue(name: string, payload: any): Promise<any>;
  getJobStatus(jobId: string): Promise<any>;
  cancelJob(jobId: string): Promise<void>;
}
