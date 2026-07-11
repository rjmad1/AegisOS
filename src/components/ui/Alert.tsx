import * as React from "react";
import { cn } from "@/utils/cn";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "destructive";
  title?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, children, ...props }, ref) => {
    const icons = {
      info: <Info className="h-5 w-5 text-sky-500" />,
      success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      destructive: <AlertCircle className="h-5 w-5 text-destructive" />,
    };

    const variants = {
      info: "border-sky-500/20 bg-sky-500/5 text-foreground",
      success: "border-emerald-500/20 bg-emerald-500/5 text-foreground",
      warning: "border-amber-500/20 bg-amber-500/5 text-foreground",
      destructive: "border-destructive/20 bg-destructive/5 text-foreground",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4 flex gap-3 items-start backdrop-blur-sm",
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="flex-shrink-0 mt-0.5">{icons[variant]}</div>
        <div className="flex flex-col space-y-1">
          {title && <h5 className="font-semibold leading-tight tracking-tight">{title}</h5>}
          <div className="text-sm opacity-90 leading-relaxed">{children}</div>
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";
