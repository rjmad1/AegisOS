"use client";

import * as React from "react";
import { 
  Search, RefreshCw, Grid, List, Table, Folder, FolderOpen, 
  ChevronRight, Star, Tag, Clock, Download, Plus, X, File,
  FileText, FileImage, FileCode, Archive, ArrowUpDown, ShieldAlert,
  Calendar, Layers, Database
} from "lucide-react";
import { Artifact, ArtifactType } from "@/types/artifact";
import { artifactService } from "@/services/artifact.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArtifactViewer } from "@/components/artifacts/ArtifactViewer";

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = React.useState<Artifact[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Filtering & Query States
  const [search, setSearch] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("all");
  const [selectedTag, setSelectedTag] = React.useState<string>("");
  const [currentFolder, setCurrentFolder] = React.useState<string>(""); // "" represents root
  const [sortField, setSortField] = React.useState<string>("createdDate");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  // Selection & Details State
  const [selectedArtifact, setSelectedArtifact] = React.useState<Artifact | null>(null);
  
  // Custom Tag Input
  const [newTag, setNewTag] = React.useState("");

  // Views Toggle
  const [viewMode, setViewMode] = React.useState<"list" | "grid" | "table">("list");

  // Resizable Panel Widths
  const [leftWidth, setLeftWidth] = React.useState(380);
  const [rightWidth, setRightWidth] = React.useState(320);

  // Fetch all artifacts from API
  const fetchArtifacts = React.useCallback(async () => {
    setLoading(true);
    try {
      const items = await artifactService.getAll({
        search: search || undefined,
        type: selectedType === "all" ? undefined : (selectedType as ArtifactType),
        sortField,
        sortOrder,
        tags: selectedTag ? [selectedTag] : undefined
      });
      setArtifacts(items);

      // Restore/reset selected item reference
      if (items.length > 0) {
        if (selectedArtifact) {
          const updatedSelected = items.find(i => i.id === selectedArtifact.id);
          if (updatedSelected) {
            setSelectedArtifact(updatedSelected);
          } else {
            setSelectedArtifact(items[0]);
          }
        } else {
          setSelectedArtifact(items[0]);
        }
      } else {
        setSelectedArtifact(null);
      }
    } catch (err) {
      console.error("Error loading artifacts:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, selectedTag, sortField, sortOrder]);

  React.useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  // Handle Drag Resizing (Left Panel)
  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setLeftWidth(Math.max(250, Math.min(600, startWidth + deltaX)));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle Drag Resizing (Right Panel)
  const handleMouseDownRight = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX; // inverse resize
      setRightWidth(Math.max(220, Math.min(500, startWidth + deltaX)));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Toggle favorite tag
  const toggleFavorite = async (art: Artifact) => {
    const isFav = !!art.metadata.isFavorite;
    await artifactService.updateArtifact(art.id, { favorites: !isFav });
    fetchArtifacts();
  };

  // Add Tag
  const handleAddTag = async () => {
    if (!selectedArtifact || !newTag.trim()) return;
    const currentTags = selectedArtifact.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      const updatedTags = [...currentTags, newTag.trim()];
      await artifactService.updateArtifact(selectedArtifact.id, { tags: updatedTags });
      setNewTag("");
      fetchArtifacts();
    }
  };

  // Remove Tag
  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedArtifact) return;
    const updatedTags = (selectedArtifact.tags || []).filter(t => t !== tagToRemove);
    await artifactService.updateArtifact(selectedArtifact.id, { tags: updatedTags });
    fetchArtifacts();
  };

  // Extract folder hierarchy & build list of unique subfolders
  const getSubfoldersAndFiles = () => {
    const folders = new Set<string>();
    const files: Artifact[] = [];

    artifacts.forEach(art => {
      const relPath = art.metadata.relativePath;
      const normalized = relPath.replace(/\\/g, "/");
      const lastSlash = normalized.lastIndexOf("/");
      const dir = lastSlash === -1 ? "." : normalized.substring(0, lastSlash);

      if (currentFolder === "") {
        // We are at root
        if (dir === ".") {
          files.push(art);
        } else {
          // Add first folder level
          const firstLevel = dir.split("/")[0];
          folders.add(firstLevel);
        }
      } else {
        // We are in some folder, e.g. "guides"
        if (dir === currentFolder) {
          files.push(art);
        } else if (dir.startsWith(currentFolder + "/")) {
          // Subfolder
          const relativeToCurrent = dir.substring(currentFolder.length + 1);
          const nextLevel = relativeToCurrent.split("/")[0];
          folders.add(currentFolder + "/" + nextLevel);
        }
      }
    });

    return {
      subfolders: Array.from(folders),
      files
    };
  };

  const { subfolders, files: currentFiles } = getSubfoldersAndFiles();

  // Get Breadcrumbs array
  const getBreadcrumbs = () => {
    if (currentFolder === "") return [];
    return currentFolder.split("/");
  };

  const navigateToBreadcrumb = (index: number) => {
    const parts = getBreadcrumbs().slice(0, index + 1);
    setCurrentFolder(parts.join("/"));
  };

  // Recent files (modified in the last 24h or top 4 modified)
  const getRecentFiles = () => {
    return [...artifacts]
      .sort((a, b) => new Date(b.modifiedDate).getTime() - new Date(a.modifiedDate).getTime())
      .slice(0, 4);
  };

  // All unique tags across all artifacts
  const getAllUniqueTags = () => {
    const tags = new Set<string>();
    artifacts.forEach(art => art.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  };

  // Icon Helper for specific types
  const getFormatIcon = (type: ArtifactType) => {
    switch (type) {
      case "word": return <FileText className="h-4 w-4" />;
      case "excel": return <FileText className="h-4 w-4" />;
      case "powerpoint": return <FileText className="h-4 w-4" />;
      case "pdf": return <FileText className="h-4 w-4" />;
      case "markdown": return <FileCode className="h-4 w-4" />;
      case "image":
      case "svg": return <FileImage className="h-4 w-4" />;
      case "json":
      case "yaml": return <FileCode className="h-4 w-4" />;
      case "zip": return <Archive className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const getFormatIconColor = (type: ArtifactType) => {
    const colors: Record<ArtifactType, string> = {
      word: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      excel: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      powerpoint: "text-orange-400 bg-orange-400/10 border-orange-400/20",
      pdf: "text-rose-400 bg-rose-400/10 border-rose-400/20",
      markdown: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
      image: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
      csv: "text-teal-400 bg-teal-400/10 border-teal-400/20",
      json: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      yaml: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      html: "text-violet-400 bg-violet-400/10 border-violet-400/20",
      mermaid: "text-sky-400 bg-sky-400/10 border-sky-400/20",
      svg: "text-pink-400 bg-pink-400/10 border-pink-400/20",
      zip: "text-slate-400 bg-slate-400/10 border-slate-400/20",
      text: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
      unknown: "text-gray-400 bg-gray-400/10 border-gray-400/20",
    };
    return colors[type] || colors.unknown;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden space-y-4 pr-1">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">Artifact Explorer</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            authoritative file-based storage registry and layout compilation server.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter names/tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 flex h-8 w-44 rounded-lg border border-border bg-card/80 px-2 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex h-8 w-28 rounded-lg border border-border bg-card/80 px-2 py-1 text-xs text-foreground focus-visible:outline-none"
          >
            <option value="all">All Formats</option>
            <option value="markdown">Markdown</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
            <option value="html">HTML</option>
            <option value="mermaid">Mermaid</option>
            <option value="text">Text</option>
            <option value="zip">Archive (ZIP)</option>
          </select>

          {/* View Toggles */}
          <div className="flex border border-border rounded-lg overflow-hidden bg-card/80">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/10"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 border-l border-r border-border ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/10"}`}
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 ${viewMode === "table" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/10"}`}
            >
              <Table className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8"
            leftIcon={<RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => fetchArtifacts()}
            disabled={loading}
          >
            Scan Disk
          </Button>
        </div>
      </div>

      {/* Main Split Panels */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden select-none bg-background rounded-xl border border-border/80">
        
        {/* PANEL 1: Left Browser */}
        <div 
          style={{ width: `${leftWidth}px` }} 
          className="flex flex-col min-h-0 bg-card/20 border-r border-border/80 overflow-hidden flex-shrink-0 select-text"
        >
          {/* Recent and Tags Mini Lists */}
          <div className="p-4 border-b border-border/60 bg-card/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center">
                <Clock className="h-3 w-3 mr-1 text-primary" /> Recent Operations
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-thin">
              {getRecentFiles().map(file => (
                <div 
                  key={file.id}
                  onClick={() => setSelectedArtifact(file)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium cursor-pointer transition-all ${
                    selectedArtifact?.id === file.id
                      ? "bg-primary/20 border-primary text-foreground"
                      : "bg-muted/15 border-border/50 hover:bg-accent/15 text-muted-foreground"
                  }`}
                >
                  {getFormatIcon(file.type)}
                  <span className="truncate max-w-[80px]">{file.name}</span>
                </div>
              ))}
            </div>

            {/* Quick Tag Pills */}
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-[9px] font-semibold text-muted-foreground/60 flex items-center mr-1">
                <Tag className="h-2.5 w-2.5 mr-0.5" /> Tags:
              </span>
              <Badge 
                variant={selectedTag === "" ? "default" : "secondary"}
                className="text-[9px] px-1.5 py-0 cursor-pointer"
                onClick={() => setSelectedTag("")}
              >
                All
              </Badge>
              {getAllUniqueTags().slice(0, 5).map(t => (
                <Badge
                  key={t}
                  variant={selectedTag === t ? "default" : "secondary"}
                  className="text-[9px] px-1.5 py-0 cursor-pointer"
                  onClick={() => setSelectedTag(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          {/* Folder Breadcrumbs & Navigation */}
          <div className="px-4 py-2 border-b border-border/60 bg-muted/10 flex items-center gap-1 text-[11px] font-medium text-muted-foreground truncate">
            <span 
              onClick={() => setCurrentFolder("")} 
              className="cursor-pointer hover:text-primary transition-colors flex items-center"
            >
              Root
            </span>
            {getBreadcrumbs().map((part, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                <span 
                  onClick={() => navigateToBreadcrumb(idx)} 
                  className={`cursor-pointer hover:text-primary transition-colors truncate max-w-[80px] ${
                    idx === getBreadcrumbs().length - 1 ? "text-foreground font-bold" : ""
                  }`}
                >
                  {part}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* File Browser Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-full">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-16 rounded-xl border border-border bg-card/40 animate-pulse" />
              ))
            ) : artifacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/5 mt-4">
                No artifacts discovered. Make sure files are in the configured storage root.
              </div>
            ) : (
              <>
                {/* 1. Folders Render */}
                {subfolders.map(folderPath => {
                  const displayFolderName = folderPath.substring(folderPath.lastIndexOf("/") + 1);
                  return (
                    <div
                      key={folderPath}
                      onClick={() => setCurrentFolder(folderPath)}
                      className="p-2.5 rounded-xl border border-border/40 bg-card/30 hover:bg-accent/15 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Folder className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                        <span>{displayFolderName}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] border-border/40 text-muted-foreground">Folder</Badge>
                    </div>
                  );
                })}

                {/* 2. Files Render based on ViewMode */}
                {viewMode === "list" && (
                  currentFiles.map(art => {
                    const active = selectedArtifact?.id === art.id;
                    const isFav = !!art.metadata.isFavorite;
                    return (
                      <div
                        key={art.id}
                        onClick={() => setSelectedArtifact(art)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 relative overflow-hidden group ${
                          active
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-border/50 bg-card hover:bg-accent/15"
                        }`}
                      >
                        <div className={`flex-shrink-0 h-9 w-9 rounded-lg border flex items-center justify-center font-bold text-[10px] uppercase ${getFormatIconColor(art.type)}`}>
                          {art.type.substring(0, 3)}
                        </div>
                        <div className="flex-1 space-y-0.5 truncate text-left">
                          <div className="flex items-center gap-1 justify-between">
                            <span className="text-xs font-bold text-foreground truncate">{art.name}</span>
                            <div className="flex items-center gap-1.5">
                              <Star 
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(art); }}
                                className={`h-3 w-3 cursor-pointer ${isFav ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 group-hover:text-muted-foreground/60'}`} 
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate leading-snug">{art.description}</p>
                          <div className="flex items-center gap-1 mt-1 text-[8px] text-muted-foreground/80 font-mono">
                            <span>{artifactService.formatBytes(art.size)}</span>
                            <span>•</span>
                            <span>{new Date(art.modifiedDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 gap-2">
                    {currentFiles.map(art => {
                      const active = selectedArtifact?.id === art.id;
                      return (
                        <div
                          key={art.id}
                          onClick={() => setSelectedArtifact(art)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            active
                              ? "border-primary bg-primary/5"
                              : "border-border/50 bg-card hover:bg-accent/15"
                          }`}
                        >
                          <div className={`h-9 w-9 rounded-lg border flex items-center justify-center font-bold text-[10px] uppercase mb-2 ${getFormatIconColor(art.type)}`}>
                            {art.type.substring(0, 3)}
                          </div>
                          <span className="text-[10px] font-bold text-foreground truncate max-w-full">{art.name}</span>
                          <span className="text-[8px] text-muted-foreground font-mono mt-0.5">{artifactService.formatBytes(art.size)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {viewMode === "table" && currentFiles.length > 0 && (
                  <div className="border border-border/50 rounded-xl overflow-hidden bg-card/40">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-muted/30 border-b border-border/40 text-muted-foreground font-bold">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Size</th>
                          <th className="p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {currentFiles.map(art => (
                          <tr 
                            key={art.id}
                            onClick={() => setSelectedArtifact(art)}
                            className={`cursor-pointer hover:bg-accent/10 ${selectedArtifact?.id === art.id ? "bg-primary/5 text-primary" : ""}`}
                          >
                            <td className="p-2 font-semibold truncate max-w-[120px]">{art.name}</td>
                            <td className="p-2 font-mono text-[9px]">{artifactService.formatBytes(art.size)}</td>
                            <td className="p-2">
                              <Download 
                                onClick={(e) => { e.stopPropagation(); artifactService.triggerDownload(art); }} 
                                className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" 
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Panel Resizer Drag Bar (Left-Center) */}
        <div 
          onMouseDown={handleMouseDownLeft}
          className="w-1 bg-border/40 hover:bg-primary/60 cursor-col-resize flex-shrink-0 transition-colors duration-150"
        />

        {/* PANEL 2: Center Preview */}
        <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden p-4">
          <ArtifactViewer artifact={selectedArtifact} />
        </div>

        {/* Panel Resizer Drag Bar (Center-Right) */}
        <div 
          onMouseDown={handleMouseDownRight}
          className="w-1 bg-border/40 hover:bg-primary/60 cursor-col-resize flex-shrink-0 transition-colors duration-150"
        />

        {/* PANEL 3: Right Metadata Detail Panel */}
        <div 
          style={{ width: `${rightWidth}px` }} 
          className="flex flex-col min-h-0 bg-card/25 border-l border-border/85 overflow-y-auto p-4 flex-shrink-0 select-text space-y-4"
        >
          {selectedArtifact ? (
            <>
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center mb-2">
                  <Database className="h-3.5 w-3.5 mr-1.5 text-primary" /> Technical Details
                </h3>
                <div className="space-y-2.5 text-[10px] p-3 rounded-lg bg-card/60 border border-border/50">
                  <div>
                    <span className="text-muted-foreground block">Deterministic Registry ID</span>
                    <span className="font-mono text-foreground break-all">{selectedArtifact.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Relative File Path</span>
                    <span className="font-mono text-foreground break-all">{selectedArtifact.metadata.relativePath}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Storage URI</span>
                    <span className="font-mono text-foreground break-all">{selectedArtifact.storage.uri}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block">MIME Protocol</span>
                      <span className="font-bold text-foreground truncate block">{selectedArtifact.mimeType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">File Bytes</span>
                      <span className="font-mono text-foreground font-bold">{artifactService.formatBytes(selectedArtifact.size)}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">SHA256 File Signature</span>
                    <span className="font-mono text-foreground break-all text-[9px]">{selectedArtifact.storage.checksum?.value}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block">Disk Created</span>
                      <span className="font-bold text-foreground block">{new Date(selectedArtifact.createdDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Last Modified</span>
                      <span className="font-bold text-foreground block">{new Date(selectedArtifact.modifiedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center">
                  <Tag className="h-3.5 w-3.5 mr-1.5 text-primary" /> Tags Management
                </h3>
                <div className="flex flex-wrap gap-1 p-2 rounded-lg border border-border/40 bg-card/20">
                  {selectedArtifact.tags.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground/60 italic">No tags assigned.</span>
                  ) : (
                    selectedArtifact.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center gap-1 bg-muted/30 hover:bg-muted/50 text-foreground text-[9px] px-2 py-0.5 rounded-full border border-border/30"
                      >
                        {tag}
                        <X 
                          className="h-2 w-2 text-muted-foreground/80 hover:text-foreground cursor-pointer" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </span>
                    ))
                  )}
                </div>
                {/* Tag Input */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="New tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex h-7 w-full rounded-md border border-border bg-card/60 px-2 py-1 text-[10px] focus-visible:outline-none"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={handleAddTag}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Relationships */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center mb-2">
                  <Layers className="h-3.5 w-3.5 mr-1.5 text-primary" /> Relationships
                </h3>
                {selectedArtifact.conversationId || selectedArtifact.workflowId ? (
                  <div className="space-y-1.5 text-[10px] p-3 rounded-lg bg-card/45 border border-border/40">
                    {selectedArtifact.conversationId && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Conversation ID</span>
                        <span className="font-mono text-foreground">{selectedArtifact.conversationId}</span>
                      </div>
                    )}
                    {selectedArtifact.workflowId && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Workflow ID</span>
                        <span className="font-mono text-foreground">{selectedArtifact.workflowId}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-muted-foreground/60 italic p-3 rounded-lg border border-dashed border-border/40 text-center">
                    No active linkages in model graph.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-xs text-muted-foreground/60 italic mt-12">
              Select an artifact to view parameters.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
