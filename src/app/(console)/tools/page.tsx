"use client";

import * as React from "react";
import Link from "next/link";
import { Wrench, Search, RefreshCw, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ToolsPage() {
  const [tools, setTools] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/v1/tools", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (category) url.searchParams.set("category", category);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load tools");
      const data = await res.json();
      setTools(data.tools);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTools();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTools();
  };

  const categories = Array.from(new Set(tools.map(t => t.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connected Tools</h1>
          <p className="text-sm text-muted-foreground">
            Explore built-in agent capabilities and active Model Context Protocol (MCP) tool schemas.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchTools}
            disabled={loading}
          >
            Refresh Tools
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tools by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-accent/20 border border-border/60 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div className="flex w-full md:w-auto items-center gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-accent/20 border border-border/60 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-auto"
              >
                <option value="">All Categories</option>
                {categories.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Button type="submit" size="sm">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tools Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-accent/10 text-xs font-bold text-muted-foreground uppercase font-mono">
                <th className="p-4">Tool Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Description</th>
                <th className="p-4">Executions</th>
                <th className="p-4">Success Rate</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && tools.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">Loading tools registry...</td>
                </tr>
              ) : tools.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">No tools found matching criteria.</td>
                </tr>
              ) : (
                tools.map((tool) => (
                  <tr key={tool.name} className="border-b border-border/20 hover:bg-accent/10 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-primary">
                      <Link href={`/tools/${encodeURIComponent(tool.name)}`} className="hover:underline">
                        {tool.name}
                      </Link>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="text-[10px] font-mono capitalize">{tool.category}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[10px] font-mono capitalize">{tool.provider}</Badge>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground max-w-sm truncate" title={tool.description}>
                      {tool.description}
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">
                      {tool.stats?.executionCount || 0}
                    </td>
                    <td className="p-4">
                      <Badge variant={tool.stats?.successRate >= 90 ? "success" : "warning"} className="text-[10px] font-mono">
                        {tool.stats?.successRate}%
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/tools/${encodeURIComponent(tool.name)}`}>
                        <Button variant="outline" size="sm">View Schema</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
