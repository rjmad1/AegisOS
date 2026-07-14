"use client";

import * as React from "react";
import { Folder, FileCode, CornerDownRight, Plus, Upload } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function FilesPage() {
  const folders = [
    {
      path: "/projects/AegisOS",
      size: "24.5 MB",
      files: [
        { name: "package.json", size: "534 Bytes", type: "JSON Config" },
        { name: "tsconfig.json", size: "670 Bytes", type: "TS Config" },
        { name: "src/app/layout.tsx", size: "719 Bytes", type: "NextJS Layout" },
      ],
    },
    {
      path: "/storage/knowledge_repository",
      size: "1.2 GB",
      files: [
        { name: "developer_playbook.md", size: "12 KB", type: "Markdown Guide" },
        { name: "architecture_topology.pdf", size: "1.5 MB", type: "PDF Vector Graph" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Files</h1>
          <p className="text-sm text-muted-foreground">
            Host directory structures accessible by orchestrator MCP servers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Upload className="h-4 w-4" />}
          >
            Upload File
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accessible Host Directories</CardTitle>
          <CardDescription>Target folders declared in system access policies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {folders.map((folder, idx) => (
            <div key={idx} className="space-y-3 p-4 rounded-xl border border-border/40 bg-accent/5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-primary" />
                  <span className="text-xs font-bold font-mono">{folder.path}</span>
                </div>
                <span className="text-xs text-muted-foreground">Total: {folder.size}</span>
              </div>

              {/* Files in folder */}
              <div className="pl-6 space-y-2 border-l border-border/20">
                {folder.files.map((file, fIdx) => (
                  <div key={fIdx} className="flex items-center justify-between text-xs py-1 hover:bg-accent/10 rounded-md px-2">
                    <div className="flex items-center space-x-2">
                      <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <FileCode className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-semibold text-foreground">{file.name}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-muted-foreground">
                      <span>{file.type}</span>
                      <span>{file.size}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
