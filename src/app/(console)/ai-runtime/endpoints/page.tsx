"use client";

import * as React from "react";
import { Link2, ChevronLeft } from "lucide-react";
import EndpointExplorer from "@/components/ai-runtime/EndpointExplorer";
import type { Endpoint } from "@/types/ai-runtime";

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = React.useState<Endpoint[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const res = await fetch("/api/v1/ai/endpoints");
        if (res.ok) {
          const data = await res.json();
          setEndpoints(data.endpoints || []);
        }
      } catch (err) {
        console.error("Failed to load endpoints:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEndpoints();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.location.href = "/ai-runtime"}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Console
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Active Gateway & Provider Endpoints</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore all active HTTP and compat sockets utilized by infrastructure provider registries in the system.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Probing endpoint statuses...</div>
      ) : (
        <EndpointExplorer endpoints={endpoints} />
      )}
    </div>
  );
}
