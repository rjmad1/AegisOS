import * as React from "react";
import { cn } from "@/utils/cn";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options = [], id, children, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
    return (
      <div className="space-y-1.5 text-left w-full">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "flex h-10 w-full rounded-lg border border-border/60 bg-accent/5 px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all pr-10",
              error && "border-destructive focus-visible:ring-destructive/30",
              className
            )}
            {...props}
          >
            {children || options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        {error && (
          <span className="text-xs font-medium text-destructive">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
