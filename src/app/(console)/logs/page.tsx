"use client";

import * as React from "react";
import Editor from "@monaco-editor/react";
import { Terminal, RefreshCw, Clipboard } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LogsPage() {
  const [copied, setCopied] = React.useState(false);

  const mockLogs = `[2026-07-09 14:10:48] [system] Starting AI Operations Console...
[2026-07-09 14:10:49] [system] Node version detected: v24.16.0
[2026-07-09 14:10:50] [database] Connecting to PostgreSQL 16 on port 5434...
[2026-07-09 14:10:51] [database] PostgreSQL 16 connected successfully.
[2026-07-09 14:10:52] [cache] Connecting to Redis on port 6379...
[2026-07-09 14:10:52] [cache] Redis connected successfully.
[2026-07-09 14:10:53] [inference] Connecting to Ollama endpoint: http://127.0.0.1:11434...
[2026-07-09 14:10:55] [inference] Ollama version 0.31.1 detected. Loaded model index.
[2026-07-09 14:10:56] [router] LiteLLM initializing on port 4000...
[2026-07-09 14:10:58] [router] LiteLLM routing strategy set to 'least-busy' with 3 fallbacks.
[2026-07-09 14:11:00] [gateway] AegisOS service binding on port 18789...
[2026-07-09 14:11:02] [gateway] AegisOS SQL database storage.sqlite loaded.
[2026-07-09 14:12:00] [operations] User 'admin' session created. Token initialized.
[2026-07-09 14:15:30] [operations] Fetching model metrics. gemma4 selected. VRAM OK.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(mockLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Logs</h1>
          <p className="text-sm text-muted-foreground">
            Host processes and inference routing server logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Clipboard className="h-4 w-4" />}
            onClick={handleCopy}
          >
            {copied ? "Copied" : "Copy logs"}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/20">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-md bg-zinc-800 text-zinc-400">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold font-mono">Console Stream &bull; stdout</CardTitle>
              <CardDescription className="text-xs">Live standard log streams.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="border-t border-border/10 bg-black">
          <Editor
            height="400px"
            language="shell"
            value={mockLogs}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: true },
              fontSize: 12,
              fontFamily: "Geist Mono, monospace",
              scrollBeyondLastLine: false,
              lineNumbers: "on",
            }}
          />
        </div>
      </Card>
    </div>
  );
}
