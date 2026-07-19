import * as fs from 'fs';
import * as path from 'path';

export interface UcdContract {
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  eventsEmitted?: string[];
}

export interface UcdPerformanceBudget {
  latencyMs: number;
  memoryMb: number;
  cpuQuotaRatio?: number;
}

export interface UcdSecurityPolicy {
  permissions: string[];
  sandboxTier: string;
}

export interface UcdVerificationSuite {
  unitTestsPath?: string;
  integrationTestsPath?: string;
  benchmarksPath?: string;
}

export interface UniversalCapabilityDescriptor {
  id: string;
  name: string;
  type: string;
  version: string;
  publisher: string;
  contracts: UcdContract;
  dependencies: string[];
  performanceBudget: UcdPerformanceBudget;
  security: UcdSecurityPolicy;
  verification: UcdVerificationSuite;
}

export class UcdParser {
  public validate(descriptor: any): string[] {
    const errors: string[] = [];

    if (!descriptor.id) errors.push('Missing capability ID');
    if (!descriptor.name) errors.push('Missing capability name');
    if (!descriptor.type) errors.push('Missing capability type');
    if (!descriptor.version) errors.push('Missing capability version');
    if (!descriptor.publisher) errors.push('Missing capability publisher');

    if (!descriptor.contracts) {
      errors.push('Missing capability contracts declaration');
    } else {
      if (!descriptor.contracts.inputs) errors.push('Missing contracts.inputs definition');
      if (!descriptor.contracts.outputs) errors.push('Missing contracts.outputs definition');
    }

    if (!descriptor.performanceBudget) {
      errors.push('Missing capability performance budgets');
    } else {
      if (typeof descriptor.performanceBudget.latencyMs !== 'number') {
        errors.push('performanceBudget.latencyMs must be a number');
      }
    }

    if (!descriptor.security) {
      errors.push('Missing capability security definitions');
    }

    return errors;
  }

  public loadFromDirectory(dirPath: string): UniversalCapabilityDescriptor | null {
    const jsonPath = path.join(dirPath, 'capability.json');
    if (!fs.existsSync(jsonPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      const data = JSON.parse(content);
      const errors = this.validate(data);
      if (errors.length > 0) {
        console.warn(`[UcdParser] Capability validation errors in ${jsonPath}:`, errors);
        return null;
      }
      return data as UniversalCapabilityDescriptor;
    } catch (err: unknown) {
      console.error(`[UcdParser] Failed to load/parse capability descriptor in ${dirPath}:`, err);
      return null;
    }
  }

  public discoverCapabilities(): UniversalCapabilityDescriptor[] {
    const capsDir = path.resolve(process.cwd(), 'src', 'capabilities');
    if (!fs.existsSync(capsDir)) {
      // Return mock capabilities representing default platform integrations if dir doesn't exist
      return this.getDefaultPlatformCapabilities();
    }

    const descriptors: UniversalCapabilityDescriptor[] = [];
    try {
      const entries = fs.readdirSync(capsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const cap = this.loadFromDirectory(path.join(capsDir, entry.name));
          if (cap) {
            descriptors.push(cap);
          }
        }
      }
    } catch (err: unknown) {
      console.error('[UcdParser] Error scanning capabilities directory:', err);
    }

    if (descriptors.length === 0) {
      return this.getDefaultPlatformCapabilities();
    }
    return descriptors;
  }

  private getDefaultPlatformCapabilities(): UniversalCapabilityDescriptor[] {
    return [
      {
        id: 'search-provider',
        name: 'Global Search Integration',
        type: 'Plugin',
        version: '1.0.0',
        publisher: 'AegisOS',
        contracts: {
          inputs: { query: 'string' },
          outputs: { results: 'array' }
        },
        dependencies: [],
        performanceBudget: {
          latencyMs: 150,
          memoryMb: 64
        },
        security: {
          permissions: ['filesystem-read'],
          sandboxTier: 'Tier1_RestrictedProcess'
        },
        verification: {}
      },
      {
        id: 'command-provider',
        name: 'Command Palette Registry',
        type: 'Plugin',
        version: '1.0.0',
        publisher: 'AegisOS',
        contracts: {
          inputs: { command: 'string' },
          outputs: { executionStatus: 'string' }
        },
        dependencies: [],
        performanceBudget: {
          latencyMs: 100,
          memoryMb: 32
        },
        security: {
          permissions: ['execution-allow'],
          sandboxTier: 'Tier0_Native'
        },
        verification: {}
      },
      {
        id: 'settings-provider',
        name: 'Settings Manager',
        type: 'Plugin',
        version: '1.0.0',
        publisher: 'AegisOS',
        contracts: {
          inputs: { key: 'string' },
          outputs: { value: 'any' }
        },
        dependencies: [],
        performanceBudget: {
          latencyMs: 50,
          memoryMb: 16
        },
        security: {
          permissions: ['database-access'],
          sandboxTier: 'Tier0_Native'
        },
        verification: {}
      }
    ];
  }
}

export const ucdParser = new UcdParser();
export default ucdParser;
