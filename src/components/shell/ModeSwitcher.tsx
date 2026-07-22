import React from "react";
import { useAppStore, AdaptiveMode } from "@/store/appStore";
import { Layers, Search, Zap, Activity, Shield, Settings, BarChart } from "lucide-react";
import { cn } from "@/utils/cn";

const MODE_DEFINITIONS: Array<{ id: AdaptiveMode; label: string; icon: React.ElementType; description: string }> = [
  { id: "explore", label: "Explore", icon: Search, description: "Learning and discovery" },
  { id: "build", label: "Build", icon: Layers, description: "Development and workflows" },
  { id: "operate", label: "Operate", icon: Activity, description: "Runtime and observability" },
  { id: "govern", label: "Govern", icon: Shield, description: "Policies and compliance" },
  { id: "manage", label: "Manage", icon: Settings, description: "Administration and users" },
  { id: "analyze", label: "Analyze", icon: BarChart, description: "Reports and KPI analysis" },
  { id: "automate", label: "Automate", icon: Zap, description: "Orchestration" }
];

export function ModeSwitcher() {
  const { activeMode, setActiveMode } = useAppStore();

  return (
    <div className="flex flex-col space-y-2 w-full p-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">
        Adaptive Mode
      </div>
      <div className="grid grid-cols-2 gap-1">
        {MODE_DEFINITIONS.map(mode => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              title={mode.description}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border",
                isActive 
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm" 
                  : "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground border-transparent"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
