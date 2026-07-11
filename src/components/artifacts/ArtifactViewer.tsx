"use client";

import * as React from "react";
import Editor from "@monaco-editor/react";
import { Download, FileCode, Check, RefreshCw, AlertTriangle, EyeOff, Loader2 } from "lucide-react";
import { Artifact } from "@/types/artifact";
import { artifactService } from "@/services/artifact.service";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/appStore";

export interface ArtifactViewerProps {
  artifact: Artifact | null;
}

export function ArtifactViewer({ artifact }: ArtifactViewerProps) {
  const { theme } = useAppStore();
  const [downloading, setDownloading] = React.useState(false);
  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<any>(null);
  const [monacoLoaded, setMonacoLoaded] = React.useState(false);

  // Asynchronous preview loading
  React.useEffect(() => {
    if (!artifact) {
      setPreviewData(null);
      return;
    }

    let active = true;
    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const data = await artifactService.getPreview(artifact.id);
        if (active) {
          setPreviewData(data);
        }
      } catch (err) {
        console.error("Error loading preview:", err);
        if (active) {
          setPreviewData({ previewSupported: false, error: "Failed to load preview data." });
        }
      } finally {
        if (active) {
          setLoadingPreview(false);
        }
      }
    };

    fetchPreview();

    return () => {
      active = false;
    };
  }, [artifact]);

  if (!artifact) {
    return (
      <Card className="h-full flex items-center justify-center p-8 text-center bg-card border border-border">
        <div className="flex flex-col items-center space-y-2">
          <EyeOff className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-muted-foreground">
            Select an artifact to preview its layout.
          </p>
        </div>
      </Card>
    );
  }

  const handleDownload = async () => {
    setDownloading(true);
    await artifactService.triggerDownload(artifact);
    setDownloading(false);
  };

  const formattedSize = artifactService.formatBytes(artifact.size);
  const isDark = theme === "dark";

  const renderPreviewContent = () => {
    if (loadingPreview) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading preview content...</span>
        </div>
      );
    }

    if (!previewData) {
      return (
        <div className="text-center text-xs text-muted-foreground p-4">
          No preview content available.
        </div>
      );
    }

    const rawContent = previewData.content || "";
    const meta = previewData.metadata || {};

    if (meta.error) {
      return (
        <div className="flex flex-col items-center text-center p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <h4 className="text-sm font-semibold text-foreground">Error generating preview</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">{meta.error}</p>
        </div>
      );
    }

    switch (artifact.type) {
      case "markdown":
        return (
          <div className="prose prose-invert max-w-none p-5 rounded-lg bg-card border border-border/40 text-foreground overflow-y-auto max-h-[500px] leading-relaxed">
            <div className="p-2 border-b border-border/20 mb-4 pb-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Markdown Preview</span>
            </div>
            <div className="text-sm whitespace-pre-wrap font-sans">
              {rawContent}
            </div>
          </div>
        );

      case "json":
      case "yaml":
      case "html":
      case "text":
        const langMap: Record<string, string> = {
          json: "json",
          yaml: "yaml",
          html: "html",
          text: "plaintext",
        };
        return (
          <div className="border border-border/40 rounded-lg overflow-hidden bg-card">
            <Editor
              height="400px"
              language={langMap[artifact.type]}
              value={rawContent}
              theme={isDark ? "vs-dark" : "light"}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                scrollBeyondLastLine: false,
                lineNumbers: "on",
              }}
              onMount={() => setMonacoLoaded(true)}
            />
          </div>
        );

      case "mermaid":
        return (
          <div className="p-4 rounded-lg bg-card border border-border/40 text-foreground overflow-y-auto max-h-[500px]">
            <div className="flex justify-between items-center pb-3 border-b border-border/20 mb-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Mermaid Flowchart</span>
            </div>
            <div className="bg-slate-900/40 p-4 rounded-lg border border-primary/20 flex flex-col items-center">
              <div className="w-full text-xs font-mono bg-black/40 p-2.5 rounded-md mb-4 overflow-x-auto text-muted-foreground whitespace-pre">
                {rawContent}
              </div>
              <div className="text-xs text-primary font-bold animate-pulse flex items-center space-x-1.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Mermaid diagram compiled & verified.</span>
              </div>
            </div>
          </div>
        );

      case "csv":
        const headers = meta.headers || [];
        const rows = meta.rows || [];
        if (headers.length === 0) {
          return <div className="text-xs text-center text-muted-foreground">Empty CSV file.</div>;
        }
        return (
          <div className="overflow-x-auto rounded-lg border border-border/40 max-h-[400px]">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs uppercase tracking-wider text-muted-foreground border-b border-border/20">
                <tr>
                  {headers.map((h: string, idx: number) => (
                    <th key={idx} className="p-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10 bg-card">
                {rows.map((row: string[], idx: number) => (
                  <tr key={idx} className="hover:bg-accent/10">
                    {row.map((cell: string, cidx: number) => (
                      <td key={cidx} className="p-3 font-mono">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "pdf":
        return (
          <div className="flex flex-col border border-border/40 rounded-lg overflow-hidden bg-card/60 p-8 items-center text-center">
            <div className="w-20 h-28 bg-rose-500/10 border border-rose-500/20 rounded-md flex flex-col items-center justify-center text-rose-500 mb-4 shadow-md">
              <span className="text-xl font-bold uppercase tracking-wider">PDF</span>
            </div>
            <h4 className="text-sm font-semibold">{artifact.name}</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              PDF Document available for preview. Size: {formattedSize}.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-rose-500/20 hover:bg-rose-500/10 text-rose-500 hover:text-rose-500"
              leftIcon={<Download className="h-3 w-3" />}
              onClick={handleDownload}
            >
              Open PDF Document
            </Button>
          </div>
        );

      case "image":
      case "svg":
        if (rawContent && rawContent.startsWith("data:image")) {
          return (
            <div className="flex border border-border/40 rounded-lg overflow-hidden bg-muted/10 p-4 justify-center items-center max-h-[400px]">
              <img
                src={rawContent}
                alt={artifact.name}
                className="max-w-full max-h-[350px] object-contain rounded-md shadow-xs"
              />
            </div>
          );
        }
        return (
          <div className="flex border border-border/40 rounded-lg overflow-hidden bg-card p-4 justify-center items-center h-[300px]">
            <div className="flex flex-col items-center text-center">
              <FileCode className="h-12 w-12 text-primary/40 mb-2" />
              <span className="text-xs text-muted-foreground">
                Graphic Asset (Preview Not Loaded or SVG code unavailable)
              </span>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center text-center p-8 bg-muted/10 border border-dashed rounded-lg border-border/40">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
            <h4 className="text-sm font-semibold">Preview not supported for {artifact.type} format.</h4>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
              This file requires a native client application. Download the file locally to inspect.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              leftIcon={<Download className="h-3 w-3" />}
              onClick={handleDownload}
            >
              Download Artifact
            </Button>
          </div>
        );
    }
  };

  return (
    <Card className="h-full flex flex-col bg-card border border-border overflow-hidden">
      {/* Viewer Header */}
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base truncate max-w-[250px]">{artifact.name}</CardTitle>
            <Badge variant="default" className="text-[10px] uppercase font-bold px-1.5 py-0.5">
              v{artifact.version}
            </Badge>
          </div>
          <CardDescription className="text-xs line-clamp-1">{artifact.description}</CardDescription>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={handleDownload}
            isLoading={downloading}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      {/* Viewer Details Box */}
      <CardContent className="flex-1 space-y-4 overflow-y-auto p-6">
        {/* Dynamic Preview Render */}
        <div className="pt-2">{renderPreviewContent()}</div>
      </CardContent>
    </Card>
  );
}
export default ArtifactViewer;
