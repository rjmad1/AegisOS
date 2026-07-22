import { EventEmitter } from 'events';

export type LifecycleState = 
  | 'Active' 
  | 'Preview' 
  | 'Beta' 
  | 'Stable' 
  | 'LTS' 
  | 'Deprecated' 
  | 'Archived' 
  | 'Retired';

export interface AssetLifecycle {
  assetId: string;
  assetType: string;
  currentState: LifecycleState;
  stateHistory: {
    state: LifecycleState;
    timestamp: Date;
    reason?: string;
  }[];
}

export class LifecycleSustainabilityFramework extends EventEmitter {
  private lifecycles: Map<string, AssetLifecycle> = new Map();

  constructor() {
    super();
  }

  public registerAsset(assetId: string, assetType: string, initialState: LifecycleState = 'Preview'): void {
    const lifecycle: AssetLifecycle = {
      assetId,
      assetType,
      currentState: initialState,
      stateHistory: [{ state: initialState, timestamp: new Date(), reason: 'Initial registration' }]
    };
    this.lifecycles.set(assetId, lifecycle);
    this.emit('lifecycle_registered', lifecycle);
  }

  public transitionState(assetId: string, newState: LifecycleState, reason?: string): void {
    const lifecycle = this.lifecycles.get(assetId);
    if (!lifecycle) throw new Error(`Asset ${assetId} not found.`);

    lifecycle.currentState = newState;
    lifecycle.stateHistory.push({ state: newState, timestamp: new Date(), reason });
    
    this.emit('lifecycle_transitioned', { assetId, newState, reason });
  }

  public getLifecycle(assetId: string): AssetLifecycle | undefined {
    return this.lifecycles.get(assetId);
  }
}
