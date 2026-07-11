"use client";

import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/utils/cn";

interface MetricCardProps {
  value: string | number;
  label: string;
  change?: number; // e.g. +12.3 or -2.5
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  label,
  change,
  changeLabel = "vs last hour",
  icon,
  className,
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className={cn("flex flex-col text-left space-y-2 p-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
      </div>
      
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {change !== undefined && (
          <span
            className={cn(
              "flex items-center text-xs font-semibold",
              isPositive && "text-success",
              isNegative && "text-destructive",
              !isPositive && !isNegative && "text-muted-foreground"
            )}
          >
            {isPositive && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
            {isNegative && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
            {change > 0 ? `+${change}` : change}%
          </span>
        )}
      </div>
      
      {change !== undefined && changeLabel && (
        <span className="text-[10px] text-muted-foreground/80">{changeLabel}</span>
      )}
    </div>
  );
};
