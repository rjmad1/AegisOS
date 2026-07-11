"use client";

import * as React from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

interface WidgetContainerProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  resizable?: boolean;
  onResize?: () => void;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  title,
  description,
  children,
  className,
  resizable,
  onResize,
}) => {
  const [maximized, setMaximized] = React.useState(false);

  return (
    <Card
      className={cn(
        "flex flex-col h-full overflow-hidden transition-all duration-200",
        maximized ? "fixed inset-4 z-50 bg-card shadow-2xl" : "",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between py-3.5 px-4 space-y-0 select-none border-b border-border/20">
        <div className="flex flex-col text-left">
          <CardTitle className="text-sm font-semibold tracking-tight">{title}</CardTitle>
          {description && <span className="text-[10px] text-muted-foreground mt-0.5">{description}</span>}
        </div>
        
        <div className="flex items-center space-x-1">
          {resizable && (
            <button
              onClick={() => {
                setMaximized(!maximized);
                if (onResize) onResize();
              }}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              {maximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 overflow-auto">
        {children}
      </CardContent>
    </Card>
  );
};
