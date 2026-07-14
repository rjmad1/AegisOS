"use client";

import * as React from "react";
import { HelpCircle, Terminal, HelpCircle as HelpIcon, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function HelpPage() {
  const hotkeys = [
    { keys: ["Ctrl", "Alt", "D"], action: "Open Dashboard View" },
    { keys: ["Ctrl", "Alt", "A"], action: "Inspect Recent Artifacts" },
    { keys: ["Ctrl", "Alt", "L"], action: "Open Console Logs Stream" },
    { keys: ["Esc"], action: "Dismiss active popup modals" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Help & References</h1>
        <p className="text-sm text-muted-foreground">
          Reference manuals and shortcut keys for the console interface.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Hotkeys */}
        <Card>
          <CardHeader>
            <CardTitle>Console Hotkeys</CardTitle>
            <CardDescription>Keyboard shortcuts configured on workstation context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hotkeys.map((hk, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-accent/5 text-left">
                <span className="text-xs font-semibold">{hk.action}</span>
                <div className="flex gap-1.5">
                  {hk.keys.map((key, kIdx) => (
                    <kbd
                      key={kIdx}
                      className="px-2 py-1 rounded bg-muted border border-border/60 text-[10px] font-bold font-mono text-muted-foreground shadow-sm"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Documentation links */}
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure Links</CardTitle>
            <CardDescription>Direct pointers to documentation files.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Ollama Served API Spec", desc: "Local Ollama host server bindings doc." },
              { label: "LiteLLM Router Config Spec", desc: "Routing policies and alias definitions." },
              { label: "AegisOS SDK reference", desc: "MCP Host setup and workflow specs." },
            ].map((link, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-accent/5 text-left">
                <div className="flex flex-col space-y-0.5">
                  <span className="text-xs font-bold flex items-center">
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 ml-1 text-primary" />
                  </span>
                  <span className="text-[10px] text-muted-foreground">{link.desc}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
