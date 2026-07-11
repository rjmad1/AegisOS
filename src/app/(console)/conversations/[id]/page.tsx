"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { MessageSquare, Bot, Calendar, ArrowLeft, Search, Clock, User, Link as LinkIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ConversationViewerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [conversation, setConversation] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const fetchConversation = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/conversations/${id}`);
        if (!res.ok) throw new Error("Conversation not found");
        const data = await res.json();
        setConversation(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading conversation viewer...</div>;
  }

  if (!conversation) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">Conversation "{id}" was not found or is no longer cached.</p>
        <Button onClick={() => router.push("/conversations")} variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to Explorer
        </Button>
      </div>
    );
  }

  // Filter messages dynamically (fuzzy search within conversation)
  const filteredMessages = conversation.messages?.filter((msg: any) => 
    msg.content.toLowerCase().includes(search.toLowerCase()) ||
    msg.sender.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center space-x-3 text-left">
        <button
          onClick={() => router.push("/conversations")}
          className="p-2 rounded-lg border border-border/40 hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Conversations</span>
          <h2 className="text-xl font-bold tracking-tight">{conversation.title}</h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Messages Stream */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="flex flex-col h-[600px] overflow-hidden">
            {/* Thread Header / Search bar */}
            <div className="p-4 border-b border-border/20 bg-card/60 flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-muted-foreground font-mono">
                {filteredMessages.length} of {conversation.messageCount} messages
              </span>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter messages in thread..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-accent/20 border border-border/40 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Message List */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-accent/5 custom-scrollbar">
              {filteredMessages.map((msg: any) => {
                const isAssistant = msg.sender.role === "assistant";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-4 ${
                      isAssistant ? "justify-start text-left" : "justify-end text-right"
                    }`}
                  >
                    {isAssistant && (
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0 mt-1">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    
                    <div className="space-y-1 max-w-[80%]">
                      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${
                        isAssistant ? "justify-start" : "justify-end"
                      }`}>
                        <span className="font-bold">{msg.sender.name}</span>
                        <span>&bull;</span>
                        <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      
                      <div
                        className={`p-4 rounded-2xl border text-sm break-words whitespace-pre-wrap ${
                          isAssistant
                            ? "bg-card border-border/60 rounded-tl-none text-left"
                            : "bg-primary text-primary-foreground border-transparent rounded-tr-none text-left"
                        }`}
                      >
                        {msg.content}
                      </div>
                      
                      {msg.durationMs && (
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          Inference duration: {(msg.durationMs / 1000).toFixed(2)}s
                        </span>
                      )}
                    </div>

                    {!isAssistant && (
                      <div className="p-2 rounded-lg bg-accent border border-border/40 text-muted-foreground shrink-0 mt-1">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredMessages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-xs">No messages match search filter.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Info Pane */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Attributes</CardTitle>
              <CardDescription>Metadata parameters of this conversation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Assigned Agent</span>
                <Link
                  href={`/agents/${conversation.agentId || "main"}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 mt-1"
                >
                  <Bot className="h-3.5 w-3.5" />
                  {conversation.agentId || "main"}
                </Link>
              </div>

              {conversation.metadata.taskId && (
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Execution Reference</span>
                  <Link
                    href={`/executions/${conversation.metadata.taskId}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 mt-1 font-mono"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {conversation.metadata.taskId.slice(0, 8)}...
                  </Link>
                </div>
              )}

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Date Created</span>
                <span className="text-xs font-semibold flex items-center gap-1.5 mt-1 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(conversation.startedAt).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Last Activity</span>
                <span className="text-xs font-semibold flex items-center gap-1.5 mt-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(conversation.updatedAt).toLocaleString()}
                </span>
              </div>

              <div className="border-t border-border/20 pt-4 space-y-3">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Context Params</span>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Mode:</span>
                    <span className="font-mono font-semibold capitalize">{conversation.metadata.type || "unknown"}</span>
                  </div>
                  {conversation.metadata.chatId && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Chat ID:</span>
                      <span className="font-mono font-semibold">{conversation.metadata.chatId}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
