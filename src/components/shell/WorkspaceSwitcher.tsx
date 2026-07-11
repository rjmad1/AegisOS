"use client";

import * as React from "react";
import { Layers, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useLayoutStore, LayoutManager } from "@/platform/layout/LayoutManager";

export const WorkspaceSwitcher: React.FC = () => {
  const { profiles, currentProfileId } = useLayoutStore();

  const currentProfile = profiles.find((p) => p.id === currentProfileId) || profiles[0];

  const dropdownItems = profiles.map((p) => ({
    label: p.name,
    icon: p.id === currentProfileId ? <Check className="h-4 w-4 text-primary" /> : <div className="h-4 w-4" />,
    onClick: () => {
      LayoutManager.loadProfile(p.id);
    },
  }));

  return (
    <DropdownMenu
      align="right"
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1.5 h-9 px-2.5 rounded-lg border border-border/20 text-muted-foreground hover:text-foreground text-xs"
        >
          <Layers className="h-4 w-4 shrink-0" />
          <span className="max-w-[100px] truncate">{currentProfile?.name || "Workspace"}</span>
        </Button>
      }
      items={dropdownItems}
    />
  );
};
