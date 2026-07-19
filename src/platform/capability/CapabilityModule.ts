import { IModuleManifest, ICompositionRoot, StartupPhase, DependencyScope } from '../core/composition/types';
import { CapabilityRegistry } from './CapabilityRegistry';
import { CapabilityScheduler } from './CapabilityScheduler';
import { CapabilityLifecycleManager } from './CapabilityLifecycleManager';
import { CapabilityDiscoveryService } from './CapabilityDiscoveryService';
import { CapabilityTrustManager } from './CapabilityTrustManager';
import { CapabilitySandboxManager } from './CapabilitySandboxManager';
import { CapabilityOptimizer } from './CapabilityOptimizer';
import { CapabilityTelemetryService } from './CapabilityTelemetryService';
import { CapabilityLearningEngine } from './CapabilityLearningEngine';
import { CapabilityGarbageCollector } from './CapabilityGarbageCollector';

export class CapabilityModule implements IModuleManifest {
  public moduleId = 'AegisOS.Platform.Capability';
  public version = '1.0.0';
  public startupPhase = StartupPhase.CAPABILITY;

  public register(container: ICompositionRoot): void {
    container.register('ICapabilityRegistry', CapabilityRegistry, DependencyScope.SINGLETON);
    container.register('ICapabilityScheduler', CapabilityScheduler, DependencyScope.SINGLETON);
    container.register('ICapabilityDiscovery', CapabilityDiscoveryService, DependencyScope.SINGLETON);
    container.register('ICapabilityTrustManager', CapabilityTrustManager, DependencyScope.SINGLETON);
    container.register('ICapabilitySandbox', CapabilitySandboxManager, DependencyScope.SINGLETON);
    container.register('ICapabilityOptimizer', CapabilityOptimizer, DependencyScope.SINGLETON);
    container.register('ICapabilityTelemetry', CapabilityTelemetryService, DependencyScope.SINGLETON);
    
    container.register('ICapabilityLifecycle', CapabilityLifecycleManager, DependencyScope.SINGLETON);
    container.register('CapabilityLearningEngine', CapabilityLearningEngine, DependencyScope.SINGLETON);
    container.register('CapabilityGarbageCollector', CapabilityGarbageCollector, DependencyScope.SINGLETON);
  }
}
