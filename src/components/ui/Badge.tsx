import * as React from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors duration-150 focus:outline-none";
  
  const variants = {
    default: "bg-primary/10 text-primary border border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border border-border",
    outline: "text-foreground border border-border",
    success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border border-amber-500/20 dark:bg-amber-500/20",
    destructive: "bg-destructive/10 text-destructive border border-destructive/20",
    info: "bg-sky-500/10 text-sky-500 border border-sky-500/20 dark:bg-sky-500/20",
  };

  return <span className={cn(baseStyles, variants[variant], className)} {...props} />;
}
