"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

interface ResizablePanelProps {
  defaultSize?: number; // percentage
  minSize?: number; // percentage
  direction?: "horizontal" | "vertical";
  children: React.ReactNode;
  className?: string;
  onResize?: (size: number) => void;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  defaultSize = 50,
  minSize = 10,
  direction = "horizontal",
  children,
  className,
  onResize,
}) => {
  const [size, setSize] = React.useState(defaultSize);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const isResizing = React.useRef(false);

  const startResize = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  }, [direction]);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !panelRef.current || !panelRef.current.parentElement) return;

      const parentRect = panelRef.current.parentElement.getBoundingClientRect();
      let newSize = 50;

      if (direction === "horizontal") {
        const offset = e.clientX - parentRect.left;
        newSize = (offset / parentRect.width) * 100;
      } else {
        const offset = e.clientY - parentRect.top;
        newSize = (offset / parentRect.height) * 100;
      }

      newSize = Math.max(minSize, Math.min(100 - minSize, newSize));
      setSize(newSize);
      if (onResize) onResize(newSize);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [direction, minSize, onResize]);

  return (
    <div
      ref={panelRef}
      style={{
        flexBasis: `${size}%`,
        flexGrow: 0,
        flexShrink: 1,
      }}
      className={cn("relative flex min-w-0 min-h-0", className)}
    >
      <div className="flex-1 min-w-0 min-h-0 overflow-auto">{children}</div>
      
      {/* Resizer Handle */}
      <div
        onMouseDown={startResize}
        className={cn(
          "absolute z-10 bg-border/20 hover:bg-primary/45 transition-colors cursor-pointer",
          direction === "horizontal"
            ? "top-0 right-0 h-full w-[4px] cursor-col-resize translate-x-[2px]"
            : "bottom-0 left-0 w-full h-[4px] cursor-row-resize translate-y-[2px]"
        )}
      />
    </div>
  );
};
