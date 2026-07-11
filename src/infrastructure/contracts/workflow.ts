import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

export interface IWorkflowProviderAdapter
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "workflow-provider";
  listWorkflows(): Promise<any[]>;
  triggerWorkflow(id: string, inputs: any): Promise<string>;
  getWorkflowExecution(executionId: string): Promise<any>;
}
