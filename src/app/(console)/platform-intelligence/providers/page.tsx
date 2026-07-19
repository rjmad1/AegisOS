"use client";

import * as React from "react";
import { Server, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import ProviderStatusCard from "@/components/ai-runtime/ProviderStatusCard";
import type { AIProvider } from "@/types/ai-runtime";

export default function ProvidersExplorerPage() {
  const [providers, setProviders] = React.useState<AIProvider[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch("/api/v1/ai/providers");
        if (res.ok) {
          const data = await res.json();
          setProviders(data.providers || []);
        }
      } catch (err) {
        console.error("Failed to load providers list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
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
        <h1 className="text-2xl font-bold tracking-tight">AI Infrastructure Providers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore and inspect all local inference engines and routing proxies configured in the workspace.
          Only canonical provider attributes are exposed to the UI.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading AI providers...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <ProviderStatusCard
              key={p.id}
              provider={p}
              onClick={() => {
                window.location.href = `/ai-runtime/providers/${p.id}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
