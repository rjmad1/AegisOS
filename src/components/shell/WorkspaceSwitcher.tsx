"use client";

import * as React from "react";
import { Layers, Check, Plus, Folder } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useWorkspaceStore } from "@/store/workspaceStore";

export const WorkspaceSwitcher: React.FC = () => {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, createWorkspace, fetchWorkspaces } = useWorkspaceStore();
  const [showModal, setShowModal] = React.useState(false);
  const [newWsName, setNewWsName] = React.useState("");
  const [newWsDesc, setNewWsDesc] = React.useState("");

  React.useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const displayName = activeWs?.name || "Select Workspace";

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    await createWorkspace({
      name: newWsName,
      description: newWsDesc,
    });

    setNewWsName("");
    setNewWsDesc("");
    setShowModal(false);
  };

  const dropdownItems = [
    ...workspaces.map((w) => ({
      label: w.name,
      icon: w.id === activeWorkspaceId ? <Check className="h-4 w-4 text-primary shrink-0" /> : <Folder className="h-4 w-4 text-muted-foreground shrink-0" />,
      onClick: () => setActiveWorkspaceId(w.id),
    })),
    {
      label: "+ New Workspace",
      icon: <Plus className="h-4 w-4 text-primary shrink-0" />,
      onClick: () => setShowModal(true),
    },
  ];

  return (
    <>
      <DropdownMenu
        align="right"
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-1.5 h-9 px-2.5 rounded-lg border border-border/20 text-muted-foreground hover:text-foreground text-xs"
          >
            <Layers className="h-4 w-4 shrink-0 text-primary" />
            <span className="max-w-[140px] truncate font-medium">{displayName}</span>
          </Button>
        }
        items={dropdownItems}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Create Workspace</h3>
            <p className="text-xs text-muted-foreground">
              Define a new operational workspace scope for repositories, documents, and missions.
            </p>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. AegisOS Production Swarm"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="Workspace scope and objectives..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Create Workspace
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
