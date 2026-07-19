"use client";

import React from "react";
import { Card } from "../ui/Card";
import { AlertTriangle } from "lucide-react";
import { ErrorBoundary } from "../ui/ErrorBoundary";

const mockRecommendations = [
  {
    id: "rec-1",
    title: "Scale up Inference Gateway",
    reason: "High latency detected in Model routing layer.",
    confidence: 92,
    action: "Apply Recommendation",
  },
  {
    id: "rec-2",
    title: "Unused Participants Detected",
    reason: "15 participants idle for > 48h.",
    confidence: 99,
    action: "Decommission",
  },
];

export function PialRecommendationsWidget() {
  return (
    <ErrorBoundary>
      <Card className="p-5 shadow-sm h-full">
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" /> PIAL Recommendations
        </h3>
        <div className="space-y-3">
          {mockRecommendations.map((rec) => (
            <div key={rec.id} className="p-3 bg-accent/30 rounded-lg text-sm border border-accent">
              <div className="font-semibold mb-1">{rec.title}</div>
              <div className="text-muted-foreground">
                {rec.reason} Confidence: {rec.confidence}%
              </div>
              <div className="mt-2 text-xs text-primary font-bold cursor-pointer hover:underline">
                {rec.action} ?
              </div>
            </div>
          ))}
        </div>
      </Card>
    </ErrorBoundary>
  );
}
