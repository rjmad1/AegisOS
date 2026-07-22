export interface DigitalWorker {
  id: string;
  name: string;
  persona: string;
  skills: string[];
  capabilities: string[];
  responsibilities: string[];
  goals: string[];
  delegationRules: any;
  memoryPolicies: any;
  toolAccess: string[];
  runtimeConstraints: any;
  governancePolicies: any;
  qualificationRequirements: string[];
}

export class DigitalWorkerFramework {
  private static instance: DigitalWorkerFramework | null = null;
  private workers: Map<string, DigitalWorker> = new Map();

  private constructor() {}

  public static getInstance(): DigitalWorkerFramework {
    if (!DigitalWorkerFramework.instance) {
      DigitalWorkerFramework.instance = new DigitalWorkerFramework();
    }
    return DigitalWorkerFramework.instance;
  }

  public registerWorker(worker: DigitalWorker): void {
    this.workers.set(worker.id, worker);
  }

  public getWorker(id: string): DigitalWorker | undefined {
    return this.workers.get(id);
  }

  public getAllWorkers(): DigitalWorker[] {
    return Array.from(this.workers.values());
  }
}

export const digitalWorkerFramework = DigitalWorkerFramework.getInstance();
