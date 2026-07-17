// src/platform/control-plane/LifecycleStateMachine.ts
import { LifecycleState } from './types';
import { eventPlatform } from '../event-bus/EventPlatform';

export class LifecycleStateMachine {
  private static instance: LifecycleStateMachine | null = null;
  private states: Map<string, LifecycleState> = new Map();

  // Valid transition pathways
  private static readonly transitions: Record<LifecycleState, LifecycleState[]> = {
    unknown: ['discovering', 'initializing', 'failed'],
    discovering: ['initializing', 'stopped', 'failed'],
    initializing: ['stopped', 'running', 'failed'],
    starting: ['running', 'failed', 'stopped'],
    running: ['paused', 'maintenance', 'healing', 'stopping', 'failed', 'degraded'],
    paused: ['running', 'stopping', 'failed'],
    maintenance: ['stopped', 'running', 'initializing'],
    healing: ['running', 'recovering', 'failed', 'degraded'],
    recovering: ['running', 'failed', 'stopped'],
    stopping: ['stopped', 'failed'],
    stopped: ['starting', 'maintenance', 'running'],
    failed: ['recovering', 'stopped', 'maintenance'],
    degraded: ['healing', 'running', 'stopping', 'failed'],
    ready: ['running', 'stopping', 'failed'],
    bootstrapping: ['resolving', 'failed'],
    resolving: ['ready', 'failed'],
    error: ['recovering', 'stopped']
  };

  private constructor() {}

  public static getInstance(): LifecycleStateMachine {
    if (!LifecycleStateMachine.instance) {
      LifecycleStateMachine.instance = new LifecycleStateMachine();
    }
    return LifecycleStateMachine.instance;
  }

  public getState(id: string): LifecycleState {
    return this.states.get(id) || 'unknown';
  }

  public registerComponentState(id: string, initialState: LifecycleState = 'unknown'): void {
    this.states.set(id, initialState);
  }

  /**
   * Evaluates and transitions a component's lifecycle state.
   */
  public async transition(id: string, targetState: LifecycleState): Promise<boolean> {
    const current = this.getState(id);
    if (current === targetState) return true; // Idempotency check

    const allowed = LifecycleStateMachine.transitions[current] || [];
    if (!allowed.includes(targetState)) {
      const errorMsg = `Illegal lifecycle state transition requested for "${id}": ${current} -> ${targetState}`;
      console.warn(`[FSM] ${errorMsg}`);
      
      await eventPlatform.publish({
        name: 'SecurityViolationDetected',
        source: 'lifecycle-fsm',
        priority: 'high',
        payload: {
          componentId: id,
          details: errorMsg,
          timestamp: Date.now()
        }
      });
      return false;
    }

    this.states.set(id, targetState);
    console.log(`[FSM] State transition verified for "${id}": ${current} -> ${targetState}`);

    // Broadcast state transition event
    await eventPlatform.publish({
      name: 'HealthChanged',
      source: 'lifecycle-fsm',
      payload: {
        componentId: id,
        oldState: current,
        newState: targetState,
        timestamp: Date.now()
      }
    });

    return true;
  }
}
export const lifecycleStateMachine = LifecycleStateMachine.getInstance();
export default lifecycleStateMachine;
