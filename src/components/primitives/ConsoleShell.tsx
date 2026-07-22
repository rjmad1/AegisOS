import React from "react";
import { useConsoleKernel } from "../../platform/console/ConsoleKernel";
import { Badge } from "../ui/Badge";
import { AlertTriangle, Server, Activity, Shield, Settings, Zap } from "lucide-react";
import { useAppStore } from "../../store/appStore";

export function ConsoleShell({ children, headerActions }: { children: React.ReactNode, headerActions?: React.ReactNode }) {
  const { domainSchema, activeEntity } = useConsoleKernel();
  const { activeMode } = useAppStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isOperateMode = activeMode === "operate";
  const isGovernMode = activeMode === "govern";
  const isAnalyzeMode = activeMode === "analyze";

  if (!mounted) {
    return <div className="h-full w-full bg-background animate-pulse" />;
  }

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative text-left">
      {/* Console Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 px-6 py-4 bg-card/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {domainSchema?.label || "Domain Console"}
              </h1>
              {activeEntity && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <Badge variant="secondary" className="font-mono text-xs">{activeEntity}</Badge>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Metadata-driven operational interface managed by AegisOS Adaptive Engine.
            </p>
          </div>
        </div>
        
        {headerActions && (
          <div className="flex items-center gap-3">
            {headerActions}
          </div>
        )}
      </div>

      {/* Adaptive Mode Context Bar */}
      {isOperateMode && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-2 flex items-center gap-2 text-destructive text-xs font-bold uppercase tracking-wider">
          <Activity className="w-4 h-4" /> Operations Mode: Realtime modifications enabled
        </div>
      )}
      {isGovernMode && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-6 py-2 flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-wider">
          <Shield className="w-4 h-4" /> Governance Mode: Audit logging enforced
        </div>
      )}
      {isAnalyzeMode && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider">
          <Zap className="w-4 h-4" /> Analysis Mode: Data aggregation active
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 overflow-auto p-6 custom-scrollbar relative ${isOperateMode ? "bg-background/95" : "bg-background"}`}>
        {domainSchema ? (
          children
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-bold text-foreground">Schema Not Registered</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-2">
                This domain does not have a registered JSON metadata schema. The ConsoleKernel cannot render the primitives.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
