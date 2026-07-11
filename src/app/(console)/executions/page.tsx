"use client";

import * as React from "react";
import Link from "next/link";
import { Play, CheckCircle2, XCircle, Clock, Search, ChevronLeft, ChevronRight, RefreshCw, Filter, Bot } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ExecutionsPage() {
  const [executions, setExecutions] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(15);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/v1/executions", window.location.origin);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());
      if (search) url.searchParams.set("search", search);
      if (status) url.searchParams.set("status", status);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load executions");
      const data = await res.json();
      setExecutions(data.executions);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchExecutions();
  }, [page, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchExecutions();
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case "succeeded":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-cyan-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "succeeded":
        return <Badge variant="success" className="capitalize text-[10px]">Succeeded</Badge>;
      case "failed":
        return <Badge variant="destructive" className="capitalize text-[10px]">Failed</Badge>;
      case "running":
        return <Badge variant="warning" className="capitalize text-[10px]">Running</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize text-[10px]">{s}</Badge>;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Execution Registry</h1>
          <p className="text-sm text-muted-foreground">
            Audit logs of SCM task executions and background agent workspace activity.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchExecutions}
            disabled={loading}
          >
            Refresh List
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
                placeholder="Search execution task descriptions or errors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-accent/20 border border-border/60 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div className="flex w-full md:w-auto items-center gap-3">
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="bg-accent/20 border border-border/60 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-auto"
                >
                  <option value="">All Statuses</option>
                  <option value="succeeded">Succeeded</option>
                  <option value="failed">Failed</option>
                  <option value="running">Running</option>
                  <option value="queued">Queued</option>
                </select>
              </div>
              <Button type="submit" size="sm">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Executions Table Card */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-accent/10 text-xs font-bold text-muted-foreground uppercase font-mono">
                <th className="p-4">Execution ID</th>
                <th className="p-4">State</th>
                <th className="p-4">Agent</th>
                <th className="p-4">Task Description</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && executions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">Loading executions database...</td>
                </tr>
              ) : executions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">No execution records found matching filters.</td>
                </tr>
              ) : (
                executions.map((exec) => (
                  <tr key={exec.id} className="border-b border-border/20 hover:bg-accent/10 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold">
                      <Link href={`/executions/${exec.id}`} className="hover:text-primary transition-colors">
                        {exec.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1.5">
                        {getStatusIcon(exec.status)}
                        {getStatusBadge(exec.status)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1 font-mono text-xs">
                        <Bot className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{exec.agentId}</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs truncate text-muted-foreground" title={exec.task}>
                      {exec.task}
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">
                      {exec.durationMs ? `${(exec.durationMs / 1000).toFixed(2)}s` : "N/A"}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground font-mono">
                      {new Date(exec.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/executions/${exec.id}`}>
                        <Button variant="outline" size="sm">View Timeline</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/20 pt-4">
          <span className="text-xs text-muted-foreground">
            Showing Page {page} of {totalPages} ({total} executions found)
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ChevronLeft className="h-4 w-4" />}
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ChevronRight className="h-4 w-4" />}
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
