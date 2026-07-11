"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare, Calendar, Bot, ChevronLeft, ChevronRight, Search, RefreshCw, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ConversationsPage() {
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/v1/conversations", window.location.origin);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());
      if (search) url.searchParams.set("search", search);
      if (status) url.searchParams.set("status", status);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = await res.json();
      setConversations(data.conversations);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchConversations();
  }, [page, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchConversations();
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "active":
        return <Badge variant="success" className="capitalize text-[10px]">Active</Badge>;
      case "completed":
        return <Badge variant="default" className="capitalize text-[10px]">Completed</Badge>;
      case "archived":
        return <Badge variant="secondary" className="capitalize text-[10px]">Archived</Badge>;
      default:
        return <Badge variant="outline" className="capitalize text-[10px]">{s}</Badge>;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversation Explorer</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and explore active agent chats, threads, and prompt responses.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchConversations}
            disabled={loading}
          >
            Refresh List
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversation summaries or titles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-accent/20 border border-border/60 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <Button type="submit" size="sm">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Conversations List */}
      <div className="space-y-4">
        {loading && conversations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Loading conversations registry...</div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No conversations found matching criteria.</div>
        ) : (
          conversations.map((conv) => (
            <Card key={conv.id} className="hover:border-primary/40 transition-colors group">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4 text-left">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary mt-1 group-hover:scale-105 transition-transform">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/conversations/${conv.id}`} className="text-base font-bold hover:text-primary transition-colors">
                        {conv.title}
                      </Link>
                      {getStatusBadge(conv.status)}
                      <Badge variant="outline" className="text-[9px] font-mono capitalize">
                        {conv.metadata.type || "unknown"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl">{conv.summary}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground pt-2 flex-wrap gap-y-1.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Bot className="h-3.5 w-3.5 text-emerald-500" />
                        agent:{conv.agentId || "none"}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3.5 w-3.5" />
                        Started: {new Date(conv.startedAt).toLocaleString()}
                      </span>
                      <span className="font-mono">{conv.messageCount} messages</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center self-end md:self-center">
                  <Link href={`/conversations/${conv.id}`}>
                    <Button variant="outline" size="sm">Open Conversation</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/20 pt-4">
          <span className="text-xs text-muted-foreground">
            Showing Page {page} of {totalPages} ({total} conversations found)
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
