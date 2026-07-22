"use client";

import * as React from "react";
import { Code2, BookOpen, LayoutGrid, Activity, BarChart3, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useAppStore } from "@/store/appStore";

export type PersonaPerspective = "developer" | "research" | "product" | "operations" | "executive" | "personal";

const PERSPECTIVE_CONFIGS: Record<
  PersonaPerspective,
  { label: string; icon: React.FC<{ className?: string }> }
> = {
  developer: { label: "Developer", icon: Code2 },
  research: { label: "Research", icon: BookOpen },
  product: { label: "Product", icon: LayoutGrid },
  operations: { label: "Operations", icon: Activity },
  executive: { label: "Executive", icon: BarChart3 },
  personal: { label: "Personal", icon: Sparkles },
};

export const PerspectiveSwitcher: React.FC = () => {
  const { activePerspective, setActivePerspective } = useAppStore();

  const currentConfig = PERSPECTIVE_CONFIGS[activePerspective as PersonaPerspective] || PERSPECTIVE_CONFIGS.developer;
  const ActiveIcon = currentConfig.icon;

  const dropdownItems = (Object.keys(PERSPECTIVE_CONFIGS) as PersonaPerspective[]).map((key) => {
    const config = PERSPECTIVE_CONFIGS[key];
    const Icon = config.icon;
    return {
      label: config.label,
      icon: (
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {key === activePerspective && <Check className="h-4 w-4 text-primary ml-auto" />}
        </div>
      ),
      onClick: () => setActivePerspective(key),
    };
  });

  return (
    <DropdownMenu
      align="right"
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1.5 h-9 px-2.5 rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 text-xs font-semibold"
        >
          <ActiveIcon className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{currentConfig.label}</span>
        </Button>
      }
      items={dropdownItems}
    />
  );
};
