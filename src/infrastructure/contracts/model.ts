import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

export interface IModelProviderAdapter
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "model-provider";
  listModels(): Promise<any[]>;
  getModelInfo(modelId: string): Promise<any>;
  runInference(modelId: string, prompt: string, options?: any): Promise<any>;
  getServedEndpoints(): Promise<string[]>;
}
