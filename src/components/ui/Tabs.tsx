import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface TabsContextProps {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextProps | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue = "", value, onValueChange, className, children, ...props }: TabsProps) {
  const [localValue, setLocalValue] = React.useState(defaultValue);
  const activeValue = value !== undefined ? value : localValue;
  const setActiveValue = React.useCallback(
    (val: string) => {
      if (value === undefined) {
        setLocalValue(val);
      }
      onValueChange?.(val);
    },
    [value, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: setActiveValue }}>
      <div className={cn("space-y-4", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center justify-start rounded-lg bg-secondary/40 p-1 text-muted-foreground border border-border/40",
        className
      )}
      {...props}
    />
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  const isActive = context.value === value;

  return (
      <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "text-foreground font-semibold"
          : "hover:text-foreground",
        className
      )}
      {...props}
    >
      {isActive && (
        <motion.div
          layoutId="tab-active-indicator"
          className="absolute inset-0 bg-background rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] border border-border/50"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  const isActive = context.value === value;

  if (!isActive) return null;

  return (
    <div
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring animate-in fade-in-50 duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
