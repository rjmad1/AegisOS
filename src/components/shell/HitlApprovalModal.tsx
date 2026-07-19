"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, X, ShieldAlert } from "lucide-react";
import { Button } from "../ui/Button";
import { EventBus } from "@/platform/event-bus/EventBus";

interface HitlRequest {
  id: string;
  action: string;
  resource: string;
  reason: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  timestamp: Date;
}

export function HitlApprovalModal() {
  const [requests, setRequests] = useState<HitlRequest[]>([]);

  useEffect(() => {
    const handleHitlRequest = (event: any) => {
      const request: HitlRequest = {
        id: event.id || `hitl-${Date.now()}`,
        action: event.action || "Unknown Action",
        resource: event.resource || "Unknown Resource",
        reason: event.reason || "Policy threshold exceeded",
        riskLevel: event.riskLevel || "high",
        timestamp: new Date(),
      };
      setRequests((prev) => [...prev, request]);
    };

    EventBus.subscribe("PolicyService:HITL_REQUEST", handleHitlRequest);
    return () => {
      // EventBus doesn't have an unsubscribe, but ideally it should
    };
  }, []);

  const handleDecision = (id: string, decision: "permit" | "deny") => {
    // Send response back
    EventBus.publish(`PolicyService:HITL_RESPONSE:${id}`, { decision, operatorId: "current-user" });
    
    // Remove from local state
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  if (requests.length === 0) return null;

  const request = requests[0]; // Handle one at a time

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-lg rounded-xl border border-destructive/50 bg-card shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-destructive/10 border-b border-destructive/20 p-4 flex items-center space-x-3">
            <div className="rounded-full bg-destructive/20 p-2 text-destructive">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Action Requires Approval</h3>
              <p className="text-sm text-muted-foreground">Human-in-the-Loop (HITL) Policy Enforcement</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Action Details</div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 font-mono text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Action:</span>
                  <span className="text-foreground">{request.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="text-foreground">{request.resource}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Level:</span>
                  <span className="text-destructive font-bold uppercase">{request.riskLevel}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Policy Reason</div>
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{request.reason}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-muted/20 border-t border-border/40 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => handleDecision(request.id, "deny")}
              leftIcon={<X className="h-4 w-4" />}
            >
              Deny Execution
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDecision(request.id, "permit")}
              leftIcon={<Check className="h-4 w-4" />}
            >
              Permit Action
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
