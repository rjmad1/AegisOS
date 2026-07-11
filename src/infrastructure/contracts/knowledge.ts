import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

export interface IKnowledgeProviderAdapter
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "knowledge-provider";
  queryKnowledge(query: string, options?: any): Promise<any[]>;
  indexKnowledgeDoc(docId: string, text: string): Promise<void>;
  removeKnowledgeDoc(docId: string): Promise<void>;
}
