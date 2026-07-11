// ============================================================================
// AI Runtime Provider Adapter — Infrastructure Contract
// ============================================================================

import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";
import type {
  AIModel,
  ModelAlias,
  Endpoint,
  ProviderHealth,
  ProviderCapabilities,
  RoutingPolicy,
  InferenceStatistics,
} from "@/types/ai-runtime";

export interface IAIRuntimeProviderAdapter
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "ai-runtime-provider";

  /** Discover all models exposed by this provider */
  discoverModels(): Promise<AIModel[]>;

  /** Discover all model aliases */
  discoverAliases(): Promise<ModelAlias[]>;

  /** Discover all connection endpoints */
  discoverEndpoints(): Promise<Endpoint[]>;

  /** Get provider-level health */
  getProviderHealth(): Promise<ProviderHealth>;

  /** Get provider capability summary */
  getProviderCapabilities(): Promise<ProviderCapabilities>;

  /** Get routing policies (only applicable for gateways like LiteLLM) */
  discoverRoutes(): Promise<RoutingPolicy[]>;

  /** Get inference statistics (read-only) */
  getInferenceStatistics(): Promise<InferenceStatistics>;

  /** Get runtime version string */
  getRuntimeVersion(): Promise<string>;
}
