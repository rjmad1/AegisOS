export interface ServiceMeshRoute {
  serviceId: string;
  canaryWeightPercent: number; // e.g. 10%
  primaryWeightPercent: number; // e.g. 90%
  mtlsStatus: "enabled" | "disabled" | "permissive";
  sidecarInjected: boolean;
}

export class ServiceMeshLayer {
  private static instance: ServiceMeshLayer | null = null;
  private routes: Map<string, ServiceMeshRoute> = new Map();

  private constructor() {
    this.initializeRoutes();
  }

  public static getInstance(): ServiceMeshLayer {
    if (!ServiceMeshLayer.instance) {
      ServiceMeshLayer.instance = new ServiceMeshLayer();
    }
    return ServiceMeshLayer.instance;
  }

  private initializeRoutes() {
    const list: ServiceMeshRoute[] = [
      { serviceId: "ollama", canaryWeightPercent: 0, primaryWeightPercent: 100, mtlsStatus: "enabled", sidecarInjected: true },
      { serviceId: "litellm", canaryWeightPercent: 10, primaryWeightPercent: 90, mtlsStatus: "enabled", sidecarInjected: true },
      { serviceId: "openclaw", canaryWeightPercent: 5, primaryWeightPercent: 95, mtlsStatus: "enabled", sidecarInjected: true },
      { serviceId: "database", canaryWeightPercent: 0, primaryWeightPercent: 100, mtlsStatus: "enabled", sidecarInjected: false } // direct socket access
    ];

    for (const r of list) {
      this.routes.set(r.serviceId, r);
    }
  }

  public getMeshRoutes(): ServiceMeshRoute[] {
    return Array.from(this.routes.values());
  }

  /**
   * Adjust routing traffic splits.
   */
  public async configureTrafficSplit(serviceId: string, canaryPercent: number): Promise<boolean> {
    const route = this.routes.get(serviceId);
    if (!route) return false;

    route.canaryWeightPercent = canaryPercent;
    route.primaryWeightPercent = 100 - canaryPercent;
    this.routes.set(serviceId, route);
    console.log(`[ServiceMesh] Configured traffic split for "${serviceId}": Canary ${canaryPercent}%, Primary ${100 - canaryPercent}%`);
    return true;
  }
}

export const serviceMeshLayer = ServiceMeshLayer.getInstance();
export default serviceMeshLayer;
