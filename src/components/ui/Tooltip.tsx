import * as React from "react";
import { cn } from "@/utils/cn";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  className,
}) => {
  const [active, setActive] = React.useState(false);

  const showTip = () => {
    setActive(true);
  };

  const hideTip = () => {
    setActive(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
      onFocus={showTip}
      onBlur={hideTip}
    >
      {children}
      {active && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 text-xs font-medium text-popover-foreground bg-popover/95 border border-border rounded shadow-md whitespace-nowrap pointer-events-none animate-in fade-in duration-100",
            positionClasses[position],
            className
          )}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};
