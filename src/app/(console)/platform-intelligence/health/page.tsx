"use client";

import * as React from "react";
import { Activity, ChevronLeft } from "lucide-react";
import HealthDashboard from "@/components/ai-runtime/HealthDashboard";
import type { RuntimeHealth } from "@/types/ai-runtime";

export default function AIRuntimeHealthPage() {
  const [health, setHealth] = React.useState<RuntimeHealth | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/runtime/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (e) {
      console.error("Failed to load health status:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchHealth();
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
        <h1 className="text-2xl font-bold tracking-tight">AI Infrastructure Health Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed diagnostic health reports for model gateway routes and physical providers. No hardware metrics.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Gathering health diagnostics...</div>
      ) : health ? (
        <HealthDashboard health={health} onRefresh={fetchHealth} loading={loading} />
      ) : (
        <p className="text-sm text-muted-foreground italic">Failed to calculate health data.</p>
      )}
    </div>
  );
}
