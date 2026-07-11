"use client";

import * as React from "react";
import { Activity, Clock, ShieldAlert, Cpu, Bot, Search, RefreshCw, FileText, Server, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EventBus } from "@/platform/event-bus/EventBus";

interface ActivityItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  type: string;
  status: string;
  payload?: any;
}

export default function ActivityPage() {
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(15);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/activity?category=${categoryFilter}&search=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (e) {
      console.error("[ActivityPage] Failed to fetch activities:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchActivities();
  }, [categoryFilter, searchQuery]);

  // Real-time Event Handling: listen to EventBus for live activity additions
  React.useEffect(() => {
    const handlePlatformEvent = (eventName: string, payload: any) => {
      // Map incoming EventBus event to an activity structure
      let action = eventName;
      let target = "Platform";
      let type = "system";
      let actor = "system";
      let status = "success";

      switch (eventName) {
        case "ArtifactCreated":
          action = "Created Artifact";
          target = payload?.relativePath || "New file";
          type = "artifact";
          break;
        case "ArtifactUpdated":
          action = "Updated Artifact";
          target = payload?.relativePath || "File";
          type = "artifact";
          break;
        case "ArtifactDeleted":
          action = "Deleted Artifact";
          target = payload?.relativePath || "File";
          type = "artifact";
          break;
        case "ConversationStarted":
          action = "Started Conversation";
          target = payload?.conversationId || "Chat";
          type = "conversation";
          actor = "user";
          break;
        case "ConversationUpdated":
          action = "Updated Conversation";
          target = payload?.conversationId || "Chat";
          type = "conversation";
          actor = "agent";
          break;
        case "ExecutionStarted":
          action = "Execution Started";
          target = payload?.executionId || "CLI Run";
          type = "execution";
          break;
        case "ExecutionCompleted":
          action = "Execution Succeeded";
          target = payload?.executionId || "CLI Run";
          type = "execution";
          break;
        case "ExecutionFailed":
          action = "Execution Failed";
          target = payload?.executionId || "CLI Run";
          type = "execution";
          status = "failed";
          break;
        case "ConfigurationChanged":
          action = "Config Updated";
          target = payload?.path || "openclaw.json";
          type = "system";
          break;
        case "ProviderDisconnected":
          action = "Provider Offline";
          target = payload?.providerName || "Provider";
          type = "provider";
          status = "failed";
          break;
        case "ProviderConnected":
          action = "Provider Online";
          target = payload?.providerName || "Provider";
          type = "provider";
          break;
        case "RuntimeHealthChanged":
          action = "Health Status Changed";
          target = `State: ${payload?.current || "unknown"}`;
          type = "system";
          status = payload?.current === "unhealthy" ? "failed" : "success";
          break;
      }

      const newActivity: ActivityItem = {
        id: `live-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date().toISOString(),
        actor,
        action,
        target,
        type,
        status,
        payload,
      };

      // Add to list if it fits filter criteria
      setActivities((prev) => {
        // Skip duplicate IDs
        if (prev.some((a) => a.id === newActivity.id)) return prev;

        const matchesFilter = categoryFilter === "all" || type === categoryFilter;
        const matchesSearch =
          !searchQuery ||
          action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          target.toLowerCase().includes(searchQuery.toLowerCase()) ||
          actor.toLowerCase().includes(searchQuery.toLowerCase());

        if (matchesFilter && matchesSearch) {
          return [newActivity, ...prev];
        }
        return prev;
      });
    };

    // Subscriptions to EventBus
    const events = [
      "ArtifactCreated", "ArtifactUpdated", "ArtifactDeleted", "MetadataUpdated",
      "ConversationStarted", "ConversationUpdated", "ConversationCompleted",
      "ExecutionStarted", "ExecutionProgress", "ExecutionCompleted", "ExecutionFailed",
      "ConfigurationChanged", "RuntimeHealthChanged", "ProviderConnected", "ProviderDisconnected"
    ];

    const subs = events.map((evt) =>
      EventBus.subscribe(evt, (payload) => handlePlatformEvent(evt, payload))
    );

    return () => {
      subs.forEach((s) => s.unsubscribe());
    };
  }, [categoryFilter, searchQuery]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "artifact":
        return <FileText className="h-4 w-4 text-amber-500" />;
      case "conversation":
        return <Bot className="h-4 w-4 text-emerald-500" />;
      case "execution":
        return <Cpu className="h-4 w-4 text-indigo-500" />;
      case "provider":
        return <Server className="h-4 w-4 text-pink-500" />;
      case "security":
        return <ShieldAlert className="h-4 w-4 text-rose-500" />;
      default:
        return <Activity className="h-4 w-4 text-sky-500" />;
    }
  };

  // Group activities by date
  const groupActivitiesByDate = (items: ActivityItem[]) => {
    const groups: Record<string, ActivityItem[]> = {};

    items.forEach((item) => {
      const date = new Date(item.timestamp);
      let groupKey = "Earlier";

      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      } else {
        groupKey = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  };

  const grouped = groupActivitiesByDate(activities.slice(0, visibleCount));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Stream</h1>
          <p className="text-sm text-muted-foreground">
            Real-time platform logs, artifact discoveries, and execution traces.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchActivities}
            disabled={loading}
          >
            Sync Log
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search action, target or actor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-accent/5 border border-border/40 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {[
                { id: "all", label: "All Items" },
                { id: "artifact", label: "Artifacts" },
                { id: "conversation", label: "Conversations" },
                { id: "execution", label: "Executions" },
                { id: "provider", label: "Providers" },
                { id: "system", label: "System" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    categoryFilter === cat.id
                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                      : "bg-transparent border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Stream */}
      {activities.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="font-bold text-lg">No activities found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Make sure background sync is active, or change filters to find matching logs.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([groupName, items]) => (
            <div key={groupName} className="space-y-4">
              <h2 className="text-xs font-extrabold tracking-wider uppercase text-muted-foreground flex items-center space-x-2 pl-3">
                <Clock className="h-3.5 w-3.5" />
                <span>{groupName}</span>
              </h2>

              <div className="relative border-l border-border/80 pl-6 ml-6 space-y-6">
                {items.map((act) => (
                  <div key={act.id} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[35px] mt-2 flex h-4 w-4 items-center justify-center rounded-full bg-background border-2 border-primary/60 group-hover:border-primary transition-all">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>

                    <div className="flex flex-col space-y-1.5 p-4 rounded-xl border border-border/30 bg-card hover:bg-accent/5 transition-all text-left">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <span className="p-1.5 rounded-lg bg-accent/10 border border-border/30 flex items-center justify-center">
                            {getTypeIcon(act.type)}
                          </span>
                          <div>
                            <span className="text-sm font-semibold">{act.action}</span>
                            <span className="text-xs text-muted-foreground ml-2">by {act.actor}</span>
                          </div>
                        </div>
                        <Badge variant={act.status === "success" ? "success" : "destructive"}>
                          {act.status === "success" ? "Completed" : "Failed"}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground pt-1 flex flex-wrap gap-x-6 gap-y-1">
                        <span>Target: <strong className="text-foreground font-semibold">{act.target}</strong></span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        {act.id.startsWith("live-") && (
                          <span className="text-emerald-500 font-extrabold flex items-center animate-pulse">
                            ● Live
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Infinite Scroll Trigger Simulation */}
          {visibleCount < activities.length && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + 15)}
              >
                Load Older Activities
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
