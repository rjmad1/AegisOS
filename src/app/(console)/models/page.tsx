"use client";

import * as React from "react";
import { Cpu, Search, Filter, Grid, Table, CheckSquare, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import ModelCard from "@/components/ai-runtime/ModelCard";
import ModelTable from "@/components/ai-runtime/ModelTable";
import CapabilityMatrix from "@/components/ai-runtime/CapabilityMatrix";
import ContextWindowViewer from "@/components/ai-runtime/ContextWindowViewer";
import type { AIModel, CapabilityName } from "@/types/ai-runtime";

export default function ModelsPage() {
  const [activeTab, setActiveTab] = React.useState("grid");
  const [loading, setLoading] = React.useState(true);
  const [models, setModels] = React.useState<AIModel[]>([]);
  const [matrix, setMatrix] = React.useState<any>(null);
  
  // Filters
  const [search, setSearch] = React.useState("");
  const [provider, setProvider] = React.useState("all");
  const [capability, setCapability] = React.useState("all");
  const [family, setFamily] = React.useState("all");

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/models?pageSize=1000");
      if (res.ok) {
        const result = await res.json();
        setModels(result.data || []);
      }

      const matRes = await fetch("/api/v1/ai/capabilities");
      if (matRes.ok) {
        const matData = await matRes.json();
        setMatrix(matData);
      }
    } catch (e) {
      console.error("Failed to load models dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchModels();
  }, []);

  const filteredModels = React.useMemo(() => {
    return models.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.displayName.toLowerCase().includes(search.toLowerCase()) ||
        m.family.toLowerCase().includes(search.toLowerCase());
      
      const matchProvider =
        provider === "all" || m.providerId === provider;
      
      const matchCap =
        capability === "all" ||
        m.capabilities.some((c) => c.name === capability && c.supported);
      
      const matchFamily =
        family === "all" || m.family.toLowerCase() === family.toLowerCase();

      return matchSearch && matchProvider && matchCap && matchFamily;
    });
  }, [models, search, provider, capability, family]);

  // Extract unique filter options
  const providers = React.useMemo(() => {
    const set = new Set(models.map((m) => m.providerId));
    return Array.from(set);
  }, [models]);

  const families = React.useMemo(() => {
    const set = new Set(models.map((m) => m.family));
    return Array.from(set).filter(Boolean);
  }, [models]);

  const uniqueCapabilities = React.useMemo(() => {
    const caps = new Set<string>();
    models.forEach((m) => {
      m.capabilities.forEach((c) => {
        if (c.supported) caps.add(c.name);
      });
    });
    return Array.from(caps).sort();
  }, [models]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Model Registry</h1>
          <p className="text-sm text-muted-foreground">
            Authoritative registry of AI models served locally or routed via API gateway proxy layers.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid gap-4 md:grid-cols-4 p-4 rounded-xl border border-border/40 bg-card/20 backdrop-blur-sm">
        <div className="relative text-left">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Search models</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, family..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary/30 border border-border/30 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="text-left">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Inference Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full bg-secondary/30 border border-border/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p.replace("-ai-runtime", "").replace("-provider", "").toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="text-left">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Model Family</label>
          <select
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            className="w-full bg-secondary/30 border border-border/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Families</option>
            {families.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="text-left">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Required Capability</label>
          <select
            value={capability}
            onChange={(e) => setCapability(e.target.value)}
            className="w-full bg-secondary/30 border border-border/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Capabilities</option>
            {uniqueCapabilities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode Tabs */}
      <Tabs defaultValue="grid" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="grid" className="flex items-center gap-1.5">
              <Grid className="h-4 w-4" /> Grid
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-1.5">
              <Table className="h-4 w-4" /> Virtual Table
            </TabsTrigger>
            <TabsTrigger value="matrix" className="flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4" /> Capability Matrix
            </TabsTrigger>
            <TabsTrigger value="context" className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" /> Context Explorer
            </TabsTrigger>
          </TabsList>
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredModels.length}</span> of {models.length} models
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            Loading model assets from local inference engine & router...
          </div>
        ) : (
          <div className="mt-4">
            <TabsContent value="grid">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredModels.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    onClick={() => {
                      window.location.href = `/models/${encodeURIComponent(model.id)}`;
                    }}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="table">
              <ModelTable
                rowData={filteredModels}
                onRowClick={(id) => {
                  window.location.href = `/models/${encodeURIComponent(id)}`;
                }}
              />
            </TabsContent>

            <TabsContent value="matrix">
              {matrix ? (
                <CapabilityMatrix matrix={matrix} />
              ) : (
                <p className="text-xs text-muted-foreground italic">Capability matrix not loaded.</p>
              )}
            </TabsContent>

            <TabsContent value="context">
              <ContextWindowViewer models={filteredModels} />
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  );
}
