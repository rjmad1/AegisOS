export enum LifecycleState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  INITIALIZED = 'INITIALIZED',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  DRAINING = 'DRAINING',
  STOPPED = 'STOPPED',
  DISPOSED = 'DISPOSED',
  ERROR = 'ERROR'
}

export interface ILifecycleContract {
  Initialize(): Promise<void>;
  Start(): Promise<void>;
  Healthy(): boolean;
  Pause(): Promise<void>;
  Resume(): Promise<void>;
  Drain(): Promise<void>;
  Stop(): Promise<void>;
  Dispose(): Promise<void>;
  getState(): LifecycleState;
}

export enum StartupPhase {
  PLATFORM_CORE = 10,
  STORAGE = 20,
  EVENT_FABRIC = 30,
  SECURITY = 40,
  IDENTITY = 50,
  CAPABILITY = 60,
  KNOWLEDGE = 70,
  AGENTS = 80,
  WORKFLOW = 90,
  RUNTIME = 100,
  PRESENTATION = 110,
  EXTENSIONS = 120
}

export enum DependencyScope {
  SINGLETON = 'SINGLETON',
  PLATFORM = 'PLATFORM',
  TENANT = 'TENANT',
  WORKSPACE = 'WORKSPACE',
  PROJECT = 'PROJECT',
  WORKFLOW = 'WORKFLOW',
  AGENT = 'AGENT',
  SESSION = 'SESSION',
  TRANSIENT = 'TRANSIENT'
}

export interface IModuleManifest {
  moduleId: string;
  version: string;
  startupPhase: StartupPhase;
  register(container: ICompositionRoot): void;
}

export interface ICompositionRoot {
  register<T>(token: symbol | string, implementation: new (...args: any[]) => T, scope: DependencyScope): void;
  registerInstance<T>(token: symbol | string, instance: T): void;
  registerFactory<T>(token: symbol | string, factory: (container: ICompositionRoot) => T, scope: DependencyScope): void;
  resolve<T>(token: symbol | string): T;
  registerModule(manifest: IModuleManifest): void;
  boot(): Promise<void>;
  shutdown(): Promise<void>;
}
