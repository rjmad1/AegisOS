import * as React from "react";
import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

export function Spinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-center p-4", className)} {...props}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton-shimmer-effect rounded-md bg-muted/40 dark:bg-muted/10 border border-border/5", className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border/10 bg-card/45 p-5 md:p-6 space-y-4 glass-panel">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4.5 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/20">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-24" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center justify-between py-3 border-b border-border/10">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-4", colIndex === 0 ? "w-32" : "w-20")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="pt-4 flex justify-end">
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Loading({ size = "md", label, className, ...props }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-4 space-y-2", className)} {...props}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {label && <p className="text-sm text-muted-foreground animate-pulse">{label}</p>}
    </div>
  );
}
