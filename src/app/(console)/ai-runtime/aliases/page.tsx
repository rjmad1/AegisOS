"use client";

import * as React from "react";
import { Tag, ChevronLeft } from "lucide-react";
import AliasExplorer from "@/components/ai-runtime/AliasExplorer";
import type { ModelAlias } from "@/types/ai-runtime";

export default function AliasesPage() {
  const [aliases, setAliases] = React.useState<ModelAlias[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAliases = async () => {
      try {
        const res = await fetch("/api/v1/ai/aliases");
        if (res.ok) {
          const data = await res.json();
          setAliases(data.aliases || []);
        }
      } catch (err) {
        console.error("Failed to load aliases:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAliases();
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
        <h1 className="text-2xl font-bold tracking-tight">AI Virtual Model Aliases</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scans all proxy-to-model redirects configured in LiteLLM and local Ollama deployments.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Scanning virtual model aliases...</div>
      ) : (
        <AliasExplorer aliases={aliases} />
      )}
    </div>
  );
}
