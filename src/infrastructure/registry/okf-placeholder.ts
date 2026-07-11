// ADR-08: Defer Adoption of Google Knowledge Catalog (OKF)
// This file serves as the architectural placeholder for future federation.

export interface OkfFederationGate {
  deferredStatus: "deferred";
  approvedAdrId: string;
  triggerConditions: string[];
  reEvaluationRequired: boolean;
}

export class OkfPlaceholder {
  private static instance: OkfPlaceholder | null = null;
  private federationGate: OkfFederationGate = {
    deferredStatus: "deferred",
    approvedAdrId: "ADR-08",
    triggerConditions: [
      "Multiple workstation users",
      "Enterprise governance audits",
      "Cloud metadata catalogs sync requirement",
      "Lineage tracking over remote datasets"
    ],
    reEvaluationRequired: false
  };

  private constructor() {}

  public static getInstance(): OkfPlaceholder {
    if (!OkfPlaceholder.instance) {
      OkfPlaceholder.instance = new OkfPlaceholder();
    }
    return OkfPlaceholder.instance;
  }

  public getGateInfo(): OkfFederationGate {
    return this.federationGate;
  }

  public auditTriggerRequirements(currentWorkstationUserCount: number, remoteCloudSyncActive: boolean): boolean {
    // If enterprise triggers are met, mark re-evaluation true
    if (currentWorkstationUserCount > 1 || remoteCloudSyncActive) {
      this.federationGate.reEvaluationRequired = true;
      console.log("[OKFPlaceholder] Trigger conditions met. Enterprise metadata catalog OKF adoption re-evaluation recommended.");
      return true;
    }
    return false;
  }
}

export const okfPlaceholder = OkfPlaceholder.getInstance();
export default okfPlaceholder;
