"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

interface PanelGroupProps {
  direction?: "horizontal" | "vertical";
  children: React.ReactNode;
  className?: string;
}

export const PanelGroup: React.FC<PanelGroupProps> = ({
  direction = "horizontal",
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex w-full h-full min-h-0",
        direction === "vertical" ? "flex-col" : "flex-row",
        className
      )}
    >
      {children}
    </div>
  );
};
