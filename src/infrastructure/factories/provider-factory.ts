import { IConfigurationProvider } from "../configuration/provider";
import { ProviderRegistry } from "../providers/registry";
import { IInfrastructureProvider } from "../contracts/provider";
import {
  OllamaProvider,
  LiteLLMProvider,
  OpenClawProvider,
  FilesystemProvider,
  WindowsProvider,
  DockerProvider,
  MockProvider,
} from "../providers/skeletons";
import { ObjectStoragePlatformProvider } from "../providers/object-storage";
import { OpenClawRuntimeProvider } from "../providers/openclaw-runtime";
import { OllamaAIRuntimeProvider } from "../providers/ollama-ai-runtime";
import { LiteLLMAIRuntimeProvider } from "../providers/litellm-ai-runtime";
import { centralConfig } from "../configuration/central-config";
import {
  OperatingSystemProvider,
  CpuProvider,
  MemoryProvider,
  DiskProvider,
  FilesystemProvider as InfraFilesystemProvider,
  NetworkProvider,
  ProcessProvider,
  GpuProvider,
  ContainerProvider,
  DatabaseProvider,
  ServiceProvider,
  PowerProvider,
  EnvironmentProvider
} from "../providers/infrastructure-providers";
import {
  ArtifactKnowledgeProvider,
  ConversationKnowledgeProvider,
  ExecutionKnowledgeProvider,
  WorkflowKnowledgeProvider,
  PromptKnowledgeProvider,
  ModelKnowledgeProvider,
  ConfigurationKnowledgeProvider,
  DocumentationProvider,
  LogProvider,
  EventProvider
} from "../providers/knowledge-providers";

export class ProviderFactory {
  private registry: ProviderRegistry;
  private configProvider?: IConfigurationProvider;

  constructor(
    registry: ProviderRegistry = ProviderRegistry.getInstance(),
    configProvider?: IConfigurationProvider
  ) {
    this.registry = registry;
    this.configProvider = configProvider;
  }

  public createAndRegisterProvider(providerId: string): IInfrastructureProvider {
    let provider: IInfrastructureProvider;

    const providerConfig = this.configProvider ? this.configProvider.getProviderConfig(providerId) : {};

    switch (providerId) {
      case "ollama-provider":
        provider = new OllamaProvider();
        break;
      case "litellm-provider":
        provider = new LiteLLMProvider();
        break;
      case "openclaw-provider":
        provider = new OpenClawProvider();
        break;
      case "openclaw-runtime-provider":
        provider = new OpenClawRuntimeProvider();
        break;
      case "filesystem-provider":
        provider = new FilesystemProvider();
        break;
      case "local-artifact-storage-provider":
        provider = new ObjectStoragePlatformProvider();
        break;
      case "windows-provider":
        provider = new WindowsProvider();
        break;
      case "docker-provider":
        provider = new DockerProvider();
        break;
      case "mock-provider":
        provider = new MockProvider();
        break;
      case "ollama-ai-runtime":
        provider = new OllamaAIRuntimeProvider();
        break;
      case "litellm-ai-runtime":
        provider = new LiteLLMAIRuntimeProvider();
        break;
      case "os-provider":
        provider = new OperatingSystemProvider();
        break;
      case "cpu-provider":
        provider = new CpuProvider();
        break;
      case "memory-provider":
        provider = new MemoryProvider();
        break;
      case "disk-provider":
        provider = new DiskProvider();
        break;
      case "filesystem-observability-provider":
        provider = new InfraFilesystemProvider();
        break;
      case "network-provider":
        provider = new NetworkProvider();
        break;
      case "process-provider":
        provider = new ProcessProvider();
        break;
      case "gpu-provider":
        provider = new GpuProvider();
        break;
      case "container-provider":
        provider = new ContainerProvider();
        break;
      case "database-provider":
        provider = new DatabaseProvider();
        break;
      case "service-provider":
        provider = new ServiceProvider();
        break;
      case "power-provider":
        provider = new PowerProvider();
        break;
      case "environment-provider":
        provider = new EnvironmentProvider();
        break;
      case "artifact-knowledge-provider":
        provider = new ArtifactKnowledgeProvider();
        break;
      case "conversation-knowledge-provider":
        provider = new ConversationKnowledgeProvider();
        break;
      case "execution-knowledge-provider":
        provider = new ExecutionKnowledgeProvider();
        break;
      case "workflow-knowledge-provider":
        provider = new WorkflowKnowledgeProvider();
        break;
      case "prompt-knowledge-provider":
        provider = new PromptKnowledgeProvider();
        break;
      case "model-knowledge-provider":
        provider = new ModelKnowledgeProvider();
        break;
      case "configuration-knowledge-provider":
        provider = new ConfigurationKnowledgeProvider();
        break;
      case "documentation-provider":
        provider = new DocumentationProvider();
        break;
      case "log-provider":
        provider = new LogProvider();
        break;
      case "event-provider":
        provider = new EventProvider();
        break;
      default:
        provider = new MockProvider();
        provider.id = providerId;
        provider.name = `Custom Provider (${providerId})`;
        break;
    }

    // Resolve configuration setup
    provider.initialize(providerConfig);

    this.registry.registerProvider(provider);
    return provider;
  }

  public registerAllDefaultProviders(): void {
    const defaultIds = [
      "ollama-provider",
      "litellm-provider",
      "openclaw-provider",
      "openclaw-runtime-provider",
      "filesystem-provider",
      "local-artifact-storage-provider",
      "windows-provider",
      "docker-provider",
      "mock-provider",
      "ollama-ai-runtime",
      "litellm-ai-runtime",
      "os-provider",
      "cpu-provider",
      "memory-provider",
      "disk-provider",
      "filesystem-observability-provider",
      "network-provider",
      "process-provider",
      "gpu-provider",
      "container-provider",
      "database-provider",
      "service-provider",
      "power-provider",
      "environment-provider",
      "artifact-knowledge-provider",
      "conversation-knowledge-provider",
      "execution-knowledge-provider",
      "workflow-knowledge-provider",
      "prompt-knowledge-provider",
      "model-knowledge-provider",
      "configuration-knowledge-provider",
      "documentation-provider",
      "log-provider",
      "event-provider",
    ];

    defaultIds.forEach((id) => {
      try {
        this.createAndRegisterProvider(id);
      } catch (err) {
        console.error(`[ProviderFactory] Failed to initialize provider "${id}":`, err);
      }
    });
  }
}
export const providerFactory = new ProviderFactory(ProviderRegistry.getInstance(), centralConfig);
providerFactory.registerAllDefaultProviders();
