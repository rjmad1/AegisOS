import deploymentManager from "../../../infrastructure/deployment/deployment-manager";
import { rollbackEngine } from "../RollbackEngine";

export class InfrastructureHandler {
  public async execute(type: string, payload: Record<string, any>, commandId: string): Promise<any> {
    const serviceId = (payload.serviceId || payload.name || "").toLowerCase();
    
    switch (type) {
      case "infrastructure:start_service": {
        if (!serviceId) throw new Error("Service identifier (serviceId) is required.");
        const ok = await deploymentManager.controlService(serviceId, "start");
        if (!ok) throw new Error(`Failed to start service: ${serviceId}`);
        
        // Register rollback: Stop the service if started
        rollbackEngine.registerInMemoryRollback(commandId, async () => {
          await deploymentManager.controlService(serviceId, "stop");
        });
        
        return { status: "started", serviceId };
      }

      case "infrastructure:stop_service": {
        if (!serviceId) throw new Error("Service identifier (serviceId) is required.");
        
        // Get status before stopping to verify if we need to start it back on rollback
        const services = await deploymentManager.getServicesStatus();
        const serv = services.find((s) => s.id === serviceId);
        const wasRunning = serv && serv.status === "started";

        const ok = await deploymentManager.controlService(serviceId, "stop");
        if (!ok) throw new Error(`Failed to stop service: ${serviceId}`);
        
        // Register rollback: Start service if it was running previously
        if (wasRunning) {
          rollbackEngine.registerInMemoryRollback(commandId, async () => {
            await deploymentManager.controlService(serviceId, "start");
          });
        }
        
        return { status: "stopped", serviceId };
      }

      case "infrastructure:restart_service": {
        if (!serviceId) throw new Error("Service identifier (serviceId) is required.");
        const ok = await deploymentManager.controlService(serviceId, "restart");
        if (!ok) throw new Error(`Failed to restart service: ${serviceId}`);
        
        // Register rollback: Restart again
        rollbackEngine.registerInMemoryRollback(commandId, async () => {
          await deploymentManager.controlService(serviceId, "restart");
        });
        
        return { status: "restarted", serviceId };
      }

      case "infrastructure:reload_service": {
        if (!serviceId) throw new Error("Service identifier (serviceId) is required.");
        console.log(`[InfrastructureHandler] Reloading configuration for ${serviceId}...`);
        return { status: "reloaded", serviceId };
      }

      case "infrastructure:update_configuration": {
        const configKey = payload.key;
        const configValue = payload.value;
        if (!configKey) throw new Error("Configuration key is required.");
        console.log(`[InfrastructureHandler] Updating config ${configKey} to ${configValue}`);
        
        // Mock success
        return { updated: true, key: configKey, value: configValue };
      }

      case "infrastructure:health_check": {
        const services = await deploymentManager.getServicesStatus();
        const listeningServices = services.map((s) => ({ id: s.id, name: s.name, status: s.status }));
        return {
          timestamp: new Date().toISOString(),
          status: "healthy",
          services: listeningServices,
        };
      }

      default:
        throw new Error(`Unsupported infrastructure command type: ${type}`);
    }
  }
}

export const infrastructureHandler = new InfrastructureHandler();
