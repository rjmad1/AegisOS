"use client";

import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Target, Server, Globe } from "lucide-react";
import { ErrorBoundary } from "../ui/ErrorBoundary";

export function QualificationWidget() {
  return (
    <ErrorBoundary>
      <Card className="p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-lg">Platform Qualification (PQF)</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Cloud Readiness */}
          <div className="p-4 bg-card border border-border/40 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span className="text-sm font-semibold">Cloud Tier</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">100%</span>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Ready</Badge>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-full" />
            </div>
          </div>

          {/* Edge Readiness */}
          <div className="p-4 bg-card border border-border/40 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Server className="h-4 w-4" />
              <span className="text-sm font-semibold">Edge Tier</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">85%</span>
              <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">Validating</Badge>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 w-[85%]" />
            </div>
          </div>
        </div>
      </Card>
    </ErrorBoundary>
  );
}
