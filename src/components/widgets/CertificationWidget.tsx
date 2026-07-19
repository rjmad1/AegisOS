"use client";

import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { ErrorBoundary } from "../ui/ErrorBoundary";

export function CertificationWidget() {
  const complianceScore = 98;
  const compliant = complianceScore >= 95;

  return (
    <ErrorBoundary>
      <Card className="p-4 space-y-4 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              <h3 className="font-semibold text-lg">ERWC Certification</h3>
            </div>
            <p className="text-xs text-muted-foreground">End-to-End Representative Workload Certification</p>
          </div>
          <Badge variant={compliant ? "success" : "destructive"}>
            {compliant ? "Compliant" : "Failing"}
          </Badge>
        </div>

        <div className="flex items-center justify-center py-4">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-indigo-500/20">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", opacity: complianceScore / 100 }} />
            <span className="text-2xl font-bold">{complianceScore}%</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Knowledge Engineering</span>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Workflow DAGs</span>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Agent Collaboration</span>
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
        </div>
      </Card>
    </ErrorBoundary>
  );
}
