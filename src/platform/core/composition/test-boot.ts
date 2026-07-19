import { PlatformBootstrapper } from './PlatformBootstrapper';
import { CapabilityModule } from '../../capability/CapabilityModule';
import { InMemoryTransport } from '../events/transports/InMemoryTransport';
import { PlatformEventFabric } from '../events/PlatformEventFabric';
import { TenantStorageManager } from '../storage/TenantStorageManager';
import { DependencyScope, ICompositionRoot, StartupPhase, IModuleManifest } from './types';

class CoreModule implements IModuleManifest {
  moduleId = 'AegisOS.Core';
  version = '1.0.0';
  startupPhase = StartupPhase.PLATFORM_CORE;

  register(container: ICompositionRoot): void {
    const transport = new InMemoryTransport();
    const eventFabric = new PlatformEventFabric(transport);
    const store: any = {
      initialize: async () => {},
      shutdown: async () => {},
      getCapability: async () => null,
      saveCapability: async () => {},
      listCapabilities: async () => []
    };
    const storageManager = new TenantStorageManager(store);

    container.registerInstance('IEventPublisher', eventFabric);
    container.registerInstance('IEventSubscriber', eventFabric);
    container.registerInstance('ICapabilityStorageProvider', storageManager);
    
    container.registerInstance('ICapabilityDiscovery', { discover: async () => [] });
    container.registerInstance('ICapabilitySandbox', { applyPolicy: async () => {} });
    container.registerInstance('ICapabilityOptimizer', { optimize: async () => {} });
  }
}

async function test() {
  console.log('--- Starting Platform Boot Test ---');
  const bootstrapper = new PlatformBootstrapper();
  const container = bootstrapper.getContainer();
  
  container.registerModule(new CoreModule());
  container.registerModule(new CapabilityModule());

  await bootstrapper.boot();
  console.log('--- Platform Booted Successfully ---');
  
  // Resolve lifecycle manager to verify DI works
  const lcm = container.resolve<any>('ICapabilityLifecycle');
  console.log('Resolved LifecycleManager instance:', !!lcm);

  await bootstrapper.shutdown();
  console.log('--- Platform Shutdown Complete ---');
}

test().catch(console.error);
