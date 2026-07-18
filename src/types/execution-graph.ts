export type ExecutionNodeType =
  | "Intent"
  | "Capability"
  | "Workflow"
  | "Agent"
  | "Tool"
  | "Knowledge"
  | "Artifact"
  | "Human Approval"
  | "Notification"
  | "Subgraph";

export interface ExecutionGraphNode {
  id: string;
  name: string;
  type: ExecutionNodeType;
  status: "queued" | "running" | "completed" | "failed" | "cancelled" | "waiting";
  config: Record<string, any>;
  input?: any;
  output?: any;
  error?: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  retryCount: number;
  maxRetries: number;
}

export interface ExecutionGraphEdge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  type: "sequential" | "parallel" | "conditional" | "failure" | "recovery";
  condition?: string; // JS expression evaluated against execution variables/node outputs
  status: "pending" | "traversed" | "skipped";
}

export interface ExecutionGraph {
  executionId: string;
  nodes: ExecutionGraphNode[];
  edges: ExecutionGraphEdge[];
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  criticalPath?: string[];
  variables: Record<string, any>;
}
