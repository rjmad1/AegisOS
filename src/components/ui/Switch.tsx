import * as React from "react";
import { cn } from "@/utils/cn";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, checked, onChange, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`;
    return (
      <div className="flex items-start space-x-3 text-left">
        <div className="flex items-center h-5">
          <input
            id={switchId}
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <label
            htmlFor={switchId}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-border/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 peer-checked:bg-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              className
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform translate-x-0.5 peer-checked:translate-x-[18px]"
              )}
            />
          </label>
        </div>
        {(label || description) && (
          <div className="flex flex-col text-sm">
            {label && <span className="font-semibold text-foreground">{label}</span>}
            {description && <span className="text-xs text-muted-foreground">{description}</span>}
          </div>
        )}
      </div>
    );
  }
);
Switch.displayName = "Switch";
