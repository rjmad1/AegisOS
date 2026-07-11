import * as React from "react";
import { cn } from "@/utils/cn";

export interface DropdownMenuItemProps {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  variant?: "default" | "destructive";
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItemProps[];
  align?: "left" | "right";
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = "right",
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-48 origin-top-right rounded-lg border border-border/60 bg-popover text-popover-foreground shadow-lg focus:outline-none py-1 animate-in fade-in duration-100",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          {items.map((item, index) => (
            <button
              key={index}
              disabled={item.disabled}
              onClick={() => {
                if (item.onClick) item.onClick();
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-accent/60 hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none text-left",
                item.variant === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              {item.icon && <span className="mr-2.5 h-4 w-4 flex items-center justify-center text-muted-foreground">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
