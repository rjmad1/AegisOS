// ============================================================================
// Platform Kernel — Core Contracts
// ============================================================================

import type { ComponentType } from 'react';

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export type LifecyclePhase =
  | 'registered'
  | 'initialized'
  | 'started'
  | 'ready'
  | 'stopping'
  | 'stopped';

export interface LifecycleHooks {
  onInit?: () => void | Promise<void>;
  onReady?: () => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export type HealthStatus = 'healthy' | 'warning' | 'degraded' | 'unhealthy' | 'unknown';

export interface HealthReport {
  status: HealthStatus;
  uptime: number;
  phase: LifecyclePhase;
  modules: ModuleHealthEntry[];
  timestamp: number;
}

export interface ModuleHealthEntry {
  moduleId: string;
  moduleName: string;
  status: HealthStatus;
  message?: string;
}

// ---------------------------------------------------------------------------
// Kernel Services
// ---------------------------------------------------------------------------

/** Platform Execution Context Service (PECS) */
export interface IExecutionContext {
  id: string;
  tenantId?: string;
  workspaceId?: string;
  projectId?: string;
  agentId?: string;
  userId?: string;
  correlationId: string;
  causationId?: string;
  roles: string[];
  securityLabels: string[];
  operatingMode: 'performance' | 'balanced' | 'efficiency' | 'safe';
  [key: string]: unknown; // Extensible for telemetry
}

export interface IExecutionContextProvider {
  run<T>(context: IExecutionContext, fn: () => T): T;
  runAsync<T>(context: IExecutionContext, fn: () => Promise<T>): Promise<T>;
  current(): IExecutionContext | undefined;
  requireCurrent(): IExecutionContext;
  create(partial?: Partial<IExecutionContext>): IExecutionContext;
}

/** Platform Resource Manager (PRM) */
export interface ResourceRequest {
  cpuCores?: number;
  memoryMb?: number;
  vramMb?: number;
  gpuCount?: number;
  tokens?: number; // e.g. for concurrency limits
  priority?: number;
}

export interface ResourceToken {
  id: string;
  granted: ResourceRequest;
  release(): void;
}

export interface IPlatformResourceManager {
  acquire(request: ResourceRequest): ResourceToken | null; // null if rejected
  acquireAsync(request: ResourceRequest, timeoutMs?: number): Promise<ResourceToken | null>;
  getUtilization(): Record<string, number>;
  getBudgets(): Record<string, number>;
}

/** Platform Policy Service (PPS) */
export interface PolicyDecision {
  action: 'permit' | 'deny' | 'permit_with_constraints';
  reason?: string;
  source: string;
  durationMs: number;
  constraints?: Record<string, unknown>;
}

export interface IPolicyService {
  evaluate(action: string, resource?: string, context?: IExecutionContext): PolicyDecision;
  evaluateAsync(action: string, resource?: string, context?: IExecutionContext): Promise<PolicyDecision>;
}

/** Platform Advisor & Optimization Service (PAOS) */
export interface OptimizationAction {
  id: string;
  reason: string;
  benefit: string;
  confidence: number;
  execute(): Promise<void> | void;
}

export interface IOptimizationService {
  observe(metric: string, value: number, tags?: Record<string, string>): void;
  getRecommendations(): OptimizationAction[];
  executeSafeOptimizations(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface PlatformNavItem {
  id: string;
  label: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  group?: string;
  order?: number;
  badge?: string | number;
  hidden?: boolean;
  roles?: string[];
}

export interface PlatformRoute {
  path: string;
  moduleId: string;
  label?: string;
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

export type PlatformCapability =
  | 'search-provider'
  | 'command-provider'
  | 'widget-provider'
  | 'settings-provider'
  | 'notification-source'
  | string;

// ---------------------------------------------------------------------------
// Service Container
// ---------------------------------------------------------------------------

export type ServiceToken<T = unknown> = string & { __brand?: T };

export interface ServiceDescriptor<T = unknown> {
  token: ServiceToken<T>;
  factory: () => T;
  singleton?: boolean;
}

// ---------------------------------------------------------------------------
// Module Definition — The contract every module implements
// ---------------------------------------------------------------------------

export interface PlatformModule {
  /** Unique module identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Semantic version */
  version: string;
  /** Domain this module belongs to */
  domain: PlatformDomain;
  /** Description of the module */
  description?: string;

  // --- Registration payloads ---
  capabilities?: PlatformCapability[];
  routes?: PlatformRoute[];
  navItems?: PlatformNavItem[];
  permissions?: string[];
  services?: ServiceDescriptor[];
  commands?: ModuleCommandDescriptor[];
  widgets?: ModuleWidgetDescriptor[];
  searchProviders?: ModuleSearchProviderDescriptor[];
  settingsDefinitions?: ModuleSettingsDescriptor[];

  // --- Lifecycle ---
  lifecycle?: LifecycleHooks;

  // --- Health ---
  getHealth?: () => ModuleHealthEntry;
}

// ---------------------------------------------------------------------------
// Module sub-descriptors (thin references — full types live in their domains)
// ---------------------------------------------------------------------------

export interface ModuleCommandDescriptor {
  id: string;
  title: string;
  category?: string;
  shortcut?: string;
  icon?: ComponentType<{ className?: string }>;
  action: () => void | Promise<void>;
  when?: () => boolean;
}

export interface ModuleWidgetDescriptor {
  id: string;
  title: string;
  description?: string;
  category?: 'card' | 'table' | 'chart' | 'metric' | 'list' | 'activity' | 'status' | 'timeline';
  component: ComponentType<Record<string, unknown>>;
  defaultSize?: { w: number; h: number };
}

export interface ModuleSearchProviderDescriptor {
  id: string;
  name: string;
  category: string;
  search: (query: string) => Promise<SearchResultItem[]>;
}

export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  href?: string;
  icon?: ComponentType<{ className?: string }>;
  category: string;
  score?: number;
  highlights?: string[];
}

export interface ModuleSettingsDescriptor {
  key: string;
  label: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'json';
  defaultValue: unknown;
  category?: string;
  options?: { label: string; value: string }[];
  experimental?: boolean;
  restartRequired?: boolean;
}

// ---------------------------------------------------------------------------
// Domains
// ---------------------------------------------------------------------------

export type PlatformDomain =
  | 'platform'
  | 'infrastructure'
  | 'operations'
  | 'knowledge'
  | 'artifacts'
  | 'administration'
  | 'settings';
