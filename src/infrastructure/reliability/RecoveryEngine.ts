import { deploymentManager } from "../deployment/deployment-manager";

export interface CircuitBreakerState {
  serviceId: string;
  state: "CLOSED" | "OPEN" | "HALF-OPEN";
  failuresCount: number;
  threshold: number;
  lastFailureTime?: number;
  cooldownPeriodMs: number;
}

export class RecoveryEngine {
  private static instance: RecoveryEngine | null = null;
  private breakers: Map<string, CircuitBreakerState> = new Map();
  private dlq: Map<string, any[]> = new Map();

  private constructor() {}

  public static getInstance(): RecoveryEngine {
    if (!RecoveryEngine.instance) {
      RecoveryEngine.instance = new RecoveryEngine();
    }
    return RecoveryEngine.instance;
  }

  // 1. Service Restart
  public async restartService(serviceId: string): Promise<boolean> {
    console.log(`[RecoveryEngine] Initiating restart for service: ${serviceId}`);
    return await deploymentManager.controlService(serviceId, "restart");
  }

  // 2. Retry Policy with Exponential Backoff
  public async executeWithRetry<T>(
    operationName: string,
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelayMs = 200
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[RecoveryEngine:Retry] Attempt ${attempt} failed for "${operationName}". Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error(`Operation "${operationName}" failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  // 3. Circuit Breaker protection
  public getBreakerState(serviceId: string, threshold = 3, cooldownMs = 5000): CircuitBreakerState {
    let breaker = this.breakers.get(serviceId);
    if (!breaker) {
      breaker = {
        serviceId,
        state: "CLOSED",
        failuresCount: 0,
        threshold,
        cooldownPeriodMs: cooldownMs
      };
      this.breakers.set(serviceId, breaker);
    }

    // Check if OPEN cooldown has expired
    if (breaker.state === "OPEN" && breaker.lastFailureTime) {
      if (Date.now() - breaker.lastFailureTime > breaker.cooldownPeriodMs) {
        breaker.state = "HALF-OPEN";
        console.log(`[RecoveryEngine:Breaker] Breaker for "${serviceId}" entered HALF-OPEN state.`);
        this.breakers.set(serviceId, breaker);
      }
    }

    return breaker;
  }

  public recordSuccess(serviceId: string) {
    const breaker = this.breakers.get(serviceId);
    if (breaker) {
      breaker.failuresCount = 0;
      breaker.state = "CLOSED";
      this.breakers.set(serviceId, breaker);
    }
  }

  public recordFailure(serviceId: string) {
    const breaker = this.getBreakerState(serviceId);
    breaker.failuresCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failuresCount >= breaker.threshold) {
      breaker.state = "OPEN";
      console.error(`[RecoveryEngine:Breaker] Breaker for "${serviceId}" TRIPPED to OPEN state! Service is quarantined.`);
    }

    this.breakers.set(serviceId, breaker);
  }

  // 4. Dead Letter Queue
  public routeToDlq(queueName: string, message: any, reason: string) {
    console.error(`[RecoveryEngine:DLQ] Message routed to DLQ [${queueName}]. Reason: ${reason}`);
    const queue = this.dlq.get(queueName) || [];
    queue.push({
      timestamp: new Date().toISOString(),
      payload: message,
      reason
    });
    this.dlq.set(queueName, queue);
  }

  public getDlq(queueName: string): any[] {
    return this.dlq.get(queueName) || [];
  }

  // 5. Graceful Degradation / Backup Failover Model Routing
  public async executeModelQuery(
    primaryQuery: () => Promise<string>,
    fallbackQuery: () => Promise<string>,
    serviceId = "ollama"
  ): Promise<string> {
    const breaker = this.getBreakerState(serviceId);

    if (breaker.state === "OPEN") {
      console.warn(`[RecoveryEngine:Degradation] primary service "${serviceId}" is quarantined (Breaker OPEN). Falling back directly.`);
      return await fallbackQuery();
    }

    try {
      const res = await primaryQuery();
      this.recordSuccess(serviceId);
      return res;
    } catch (err) {
      this.recordFailure(serviceId);
      console.warn(`[RecoveryEngine:Degradation] primary query failed. Activating degradation fallback.`);
      return await fallbackQuery();
    }
  }
}

export const recoveryEngine = RecoveryEngine.getInstance();
export default recoveryEngine;
