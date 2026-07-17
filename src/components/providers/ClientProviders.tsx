"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { realtimeSyncManager } from "@/platform/realtime/RealtimeSyncManager";
import { EventBus } from "@/platform/event-bus/EventBus";
import { allModules } from "@/platform/kernel/boot";
import { ModuleRegistry } from "@/platform/module-registry/ModuleRegistry";

// Register modules synchronously on the client so that initial render of Navigation groups works
if (typeof window !== 'undefined') {
  allModules.forEach(mod => ModuleRegistry.register(mod));
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  React.useEffect(() => {
    // 1. (Server handles platform boot via instrumentation)

    // 2. Start real-time sync coordinator
    realtimeSyncManager.startSync().catch(console.error);

    // 3. Register event-driven query cache invalidation listeners
    const unsubscribes: Array<() => void> = [];

    const reg = (event: string, queryKeys: string[][]) => {
      const sub = EventBus.subscribe(event, () => {
        console.log(`[CacheInvalidation] Invalidating keys for event: ${event}`);
        queryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      });
      unsubscribes.push(() => sub.unsubscribe());
    };

    // Artifact cache invalidation
    reg('ArtifactCreated', [['artifacts']]);
    reg('ArtifactUpdated', [['artifacts']]);
    reg('ArtifactDeleted', [['artifacts']]);
    reg('MetadataUpdated', [['artifacts']]);

    // Conversations cache invalidation
    reg('ConversationStarted', [['conversations']]);
    reg('ConversationUpdated', [['conversations']]);
    reg('ConversationCompleted', [['conversations']]);

    // Executions cache invalidation
    reg('ExecutionStarted', [['executions']]);
    reg('ExecutionProgress', [['executions']]);
    reg('ExecutionCompleted', [['executions']]);
    reg('ExecutionFailed', [['executions']]);

    // Agents, tools, workflows cache invalidation
    reg('AgentRegistered', [['agents']]);
    reg('AgentUpdated', [['agents']]);
    reg('ToolRegistered', [['tools']]);
    reg('WorkflowDiscovered', [['workflows']]);
    reg('WorkflowUpdated', [['workflows']]);

    // Runtime and health metrics
    reg('RuntimeHealthChanged', [['runtime']]);
    reg('ConfigurationChanged', [['runtime']]);
    reg('ProviderConnected', [['runtime']]);
    reg('ProviderDisconnected', [['runtime']]);

    return () => {
      // Cleanup on unmount
      realtimeSyncManager.stopSync().catch(console.error);
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>{children}</AuthGuard>
    </QueryClientProvider>
  );
}
