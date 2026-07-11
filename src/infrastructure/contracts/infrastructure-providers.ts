// ============================================================================
// Infrastructure Provider Contracts — Phase 7
// ============================================================================

import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";
import {
  OperatingSystem,
  CPU,
  Memory,
  Disk,
  Filesystem,
  NetworkInterface,
  NetworkConnection,
  Process,
  GPU,
  Container,
  Database,
  Service,
  PowerStatus,
  EnvironmentVariable
} from "@/types/infrastructure";

export interface IOperatingSystemProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getOperatingSystem(): Promise<OperatingSystem>;
}

export interface ICpuProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getCpu(): Promise<CPU>;
}

export interface IMemoryProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getMemory(): Promise<Memory>;
}

export interface IDiskProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getDisks(): Promise<Disk[]>;
}

export interface IFilesystemProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getFilesystems(): Promise<Filesystem[]>;
}

export interface INetworkProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getInterfaces(): Promise<NetworkInterface[]>;
  getConnections(): Promise<NetworkConnection[]>;
}

export interface IProcessProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getProcesses(options?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: "pid" | "name" | "cpu" | "memory";
    sortOrder?: "asc" | "desc";
  }): Promise<{ processes: Process[]; total: number }>;
}

export interface IGpuProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getGpu(): Promise<GPU>;
}

export interface IContainerProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getContainers(): Promise<Container[]>;
}

export interface IDatabaseProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getDatabases(): Promise<Database[]>;
}

export interface IServiceProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getServices(): Promise<Service[]>;
}

export interface IPowerProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getPowerStatus(): Promise<PowerStatus>;
}

export interface IEnvironmentProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getEnvironmentVariables(): Promise<EnvironmentVariable[]>;
}
