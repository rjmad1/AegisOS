import { EventEmitter } from 'events';

export type InteroperabilityProtocol = 
  | 'MCP' 
  | 'OpenAPI' 
  | 'AsyncAPI' 
  | 'CloudEvents' 
  | 'GraphQL' 
  | 'OCI' 
  | 'KubernetesCRD' 
  | 'GitOps' 
  | 'OpenTelemetry';

export interface InteroperabilityAdapter {
  id: string;
  protocol: InteroperabilityProtocol;
  endpoint?: string;
  version: string;
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  status(): 'connected' | 'disconnected' | 'degraded';
}

export class PlatformInteroperabilityFramework extends EventEmitter {
  private adapters: Map<string, InteroperabilityAdapter> = new Map();

  constructor() {
    super();
  }

  public registerAdapter(adapter: InteroperabilityAdapter): void {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Adapter ${adapter.id} already registered.`);
    }
    this.adapters.set(adapter.id, adapter);
    this.emit('adapter_registered', adapter);
  }

  public async connectAdapter(id: string): Promise<boolean> {
    const adapter = this.adapters.get(id);
    if (!adapter) throw new Error(`Adapter ${id} not found.`);
    
    const success = await adapter.connect();
    if (success) {
      this.emit('adapter_connected', id);
    }
    return success;
  }

  public getAdapterStatus(id: string): string {
    const adapter = this.adapters.get(id);
    return adapter ? adapter.status() : 'unknown';
  }
}
