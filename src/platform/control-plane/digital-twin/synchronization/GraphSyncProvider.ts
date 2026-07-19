// src/platform/control-plane/digital-twin/synchronization/GraphSyncProvider.ts
import { GraphKernel } from '../core/GraphKernel';

export interface GraphSyncProvider {
  readonly domainName: string;
  
  /**
   * Synchronizes the domain-specific nodes and edges into the given GraphKernel.
   */
  sync(kernel: GraphKernel): Promise<void>;
  
  /**
   * Translates a runtime event from this domain into a graph mutation.
   */
  handleEvent?(kernel: GraphKernel, eventName: string, payload: any): Promise<boolean>;
}
