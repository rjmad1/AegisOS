import * as React from "react";
import { Inbox, AlertCircle } from "lucide-react";
import { Button } from "./Button";
import { motion } from "framer-motion";

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
  icon = <Inbox className="h-6 w-6 text-muted-foreground" />,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center p-10 text-center rounded-xl border border-dashed border-border/60 bg-muted/5 glass-panel"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/15 mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-base font-bold leading-none tracking-tight">{title}</h3>
      <p className="mt-2.5 text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center p-10 text-center rounded-xl border border-destructive/20 bg-destructive/5 glass-panel"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 mb-4 shadow-sm">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-base font-bold leading-none tracking-tight text-destructive">{title}</h3>
      <p className="mt-2.5 text-sm text-muted-foreground max-w-xs leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-5 border-destructive/20 hover:bg-destructive/10 text-destructive hover:text-destructive">
          {retryLabel}
        </Button>
      )}
    </motion.div>
  );
}
