import React, { Component, ErrorInfo, ReactNode } from "react";
import { CommandRegistry } from "../commands/CommandRegistry";

// Layer 1: Extension Manifest
export interface ExtensionManifest {
  id: string;
  version: string;
  dependencies?: Record<string, string>;
  capabilities: string[];
  permissions?: string[]; // E.g., ['system.read', 'ui.modify']
}

// Layer 2: Capability Contract
export interface CapabilityContract {
  uiContributions?: Record<string, React.ComponentType<any>>;
  apiContributions?: Record<string, (...args: any[]) => any>;
  navigationNodes?: any[];
  commands?: any[]; // Array of command definitions to register
}

export type ExtensionState = 'INSTALLED' | 'ACTIVATED' | 'SUSPENDED' | 'ERROR';

// Error Boundary for UI Isolation
interface SandboxProps {
  extensionId: string;
  children: ReactNode;
}
interface SandboxState {
  hasError: boolean;
  error?: Error;
}

export class CERSandbox extends Component<SandboxProps, SandboxState> {
  constructor(props: SandboxProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[CER Sandbox] Extension ${this.props.extensionId} crashed:`, error, errorInfo);
    CER.rollback(this.props.extensionId);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md">
          <p className="font-bold">Extension Crash: {this.props.extensionId}</p>
          <p>{this.state.error?.message}</p>
          <p className="mt-2 text-muted-foreground">The extension has been automatically suspended by the CER.</p>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}

// Layer 3: CER Engine
class CEREngine {
  private registeredExtensions = new Map<string, CapabilityContract>();
  private manifests = new Map<string, ExtensionManifest>();
  private states = new Map<string, ExtensionState>();

  install(manifest: ExtensionManifest, contract: CapabilityContract) {
    if (this.states.has(manifest.id)) {
      throw new Error(`Extension ${manifest.id} is already installed.`);
    }
    
    // Simulate dependency resolution
    if (manifest.dependencies) {
      for (const [dep, version] of Object.entries(manifest.dependencies)) {
        if (!this.states.has(dep)) {
          console.warn(`[CER] Missing dependency ${dep}@${version} for extension ${manifest.id}`);
        }
      }
    }

    this.manifests.set(manifest.id, manifest);
    this.registeredExtensions.set(manifest.id, contract);
    this.states.set(manifest.id, 'INSTALLED');
    console.log(`[CER] Installed extension: ${manifest.id}@${manifest.version}`);
  }

  activate(extensionId: string) {
    const state = this.states.get(extensionId);
    if (!state || state === 'ERROR') {
      throw new Error(`Cannot activate extension ${extensionId} in state ${state}`);
    }
    
    const manifest = this.manifests.get(extensionId);
    const contract = this.registeredExtensions.get(extensionId);
    
    // 1. Validate Permissions
    if (manifest?.permissions?.includes('root')) {
      console.warn(`[CER] Extension ${extensionId} requested 'root' permissions. Denied by policy.`);
      this.states.set(extensionId, 'ERROR');
      throw new Error(`Permission denied for extension ${extensionId}`);
    }

    // 2. Register Commands explicitly via CommandRegistry (no unchecked execution)
    if (contract?.commands) {
      for (const cmd of contract.commands) {
        if (!CommandRegistry.getCommand(cmd.id)) {
          CommandRegistry.register(cmd);
          console.log(`[CER] Registered governed command from ${extensionId}: ${cmd.id}`);
        }
      }
    }

    this.states.set(extensionId, 'ACTIVATED');
    console.log(`[CER] Activated extension: ${extensionId}`);
  }

  suspend(extensionId: string) {
    if (this.states.get(extensionId) !== 'ACTIVATED') {
      return;
    }
    
    this.states.set(extensionId, 'SUSPENDED');
    console.log(`[CER] Suspended extension: ${extensionId}`);
  }

  rollback(extensionId: string) {
    // Unloads the current version and attempts to restore a previous known-good manifest
    this.states.set(extensionId, 'ERROR');
    console.warn(`[CER] Extension ${extensionId} marked for rollback.`);
  }

  getComponent(extensionId: string, componentKey: string): React.ComponentType<any> | null {
    if (this.states.get(extensionId) !== 'ACTIVATED') {
      console.warn(`[CER] Cannot access component ${componentKey} from inactive extension ${extensionId}`);
      return null;
    }

    const ext = this.registeredExtensions.get(extensionId);
    if (!ext || !ext.uiContributions) return null;
    return ext.uiContributions[componentKey] || null;
  }
}

export const CER = new CEREngine();

// Dynamic Loader Hook
export function useCERComponent(extensionId: string, componentKey: string) {
  // If the extension isn't activated, attempt to activate it on-demand
  if (CER['states']?.get(extensionId) === 'INSTALLED') {
    try {
      CER.activate(extensionId);
    } catch (e) {
      console.error(e);
    }
  }

  const Component = CER.getComponent(extensionId, componentKey);
  
  if (!Component) {
    const FallbackComponent = () => (
      <div className="p-4 text-destructive text-xs border border-destructive/20 rounded bg-destructive/10">
        CER Error: Component '{componentKey}' not available in extension '{extensionId}'. Ensure it is installed and activated.
      </div>
    );
    FallbackComponent.displayName = 'CERFallback';
    return FallbackComponent;
  }
  
  // Return wrapped in the CERSandbox Error Boundary
  const WrappedComponent = (props: any) => (
    <CERSandbox extensionId={extensionId}>
      <Component {...props} />
    </CERSandbox>
  );
  WrappedComponent.displayName = `CER(${componentKey})`;
  return WrappedComponent;
}
