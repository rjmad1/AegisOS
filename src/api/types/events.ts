import { Artifact } from "@/types/artifact";
import { Job } from "./background-processing";

export interface BaseEvent {
  id: string;
  timestamp: string;
  source: string; // Component or service that emitted it
}

export interface ArtifactCreatedEvent extends BaseEvent {
  name: "ArtifactCreated";
  payload: {
    artifact: Artifact;
  };
}

export interface ArtifactUpdatedEvent extends BaseEvent {
  name: "ArtifactUpdated";
  payload: {
    artifactId: string;
    changes: Partial<Artifact>;
  };
}

export interface ArtifactDeletedEvent extends BaseEvent {
  name: "ArtifactDeleted";
  payload: {
    artifactId: string;
  };
}

export interface JobStartedEvent extends BaseEvent {
  name: "JobStarted";
  payload: {
    jobId: string;
    jobName: string;
    priority: string;
  };
}

export interface JobCompletedEvent extends BaseEvent {
  name: "JobCompleted";
  payload: {
    jobId: string;
    jobName: string;
    result: any;
  };
}

export interface JobFailedEvent extends BaseEvent {
  name: "JobFailed";
  payload: {
    jobId: string;
    jobName: string;
    error: {
      message: string;
      code?: string;
    };
  };
}

export interface ServiceStartedEvent extends BaseEvent {
  name: "ServiceStarted";
  payload: {
    serviceId: string;
    port: number;
    pid: number;
  };
}

export interface ServiceStoppedEvent extends BaseEvent {
  name: "ServiceStopped";
  payload: {
    serviceId: string;
    exitCode: number;
  };
}

export interface SettingsChangedEvent extends BaseEvent {
  name: "SettingsChanged";
  payload: {
    section: string;
    changes: Record<string, any>;
  };
}

export interface SearchIndexedEvent extends BaseEvent {
  name: "SearchIndexed";
  payload: {
    entityId: string;
    entityType: "artifact" | "file" | "job";
    indexedFields: string[];
    durationMs: number;
  };
}

export interface NotificationRaisedEvent extends BaseEvent {
  name: "NotificationRaised";
  payload: {
    notificationId: string;
    message: string;
    severity: "info" | "warning" | "error" | "success";
  };
}

export type AppEvent =
  | ArtifactCreatedEvent
  | ArtifactUpdatedEvent
  | ArtifactDeletedEvent
  | JobStartedEvent
  | JobCompletedEvent
  | JobFailedEvent
  | ServiceStartedEvent
  | ServiceStoppedEvent
  | SettingsChangedEvent
  | SearchIndexedEvent
  | NotificationRaisedEvent;

export interface IEventBus {
  publish(event: AppEvent): Promise<void>;
  subscribe<T extends AppEvent["name"]>(
    name: T,
    handler: (event: Extract<AppEvent, { name: T }>) => void | Promise<void>
  ): string; // Returns subscription ID
  unsubscribe(subscriptionId: string): void;
}
