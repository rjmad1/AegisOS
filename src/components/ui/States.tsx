import * as React from "react";
import { Inbox, AlertCircle } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "No data found",
  description = "There are no records matching this query.",
  actionLabel,
  onAction,
  icon = <Inbox className="h-10 w-10 text-muted-foreground" />,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border/60 bg-muted/10 glass-panel">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold leading-none tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "An error occurred",
  message = "Failed to fetch operational data from local host.",
  retryLabel = "Retry connection",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-destructive/20 bg-destructive/5 glass-panel">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-base font-semibold leading-none tracking-tight text-destructive">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
