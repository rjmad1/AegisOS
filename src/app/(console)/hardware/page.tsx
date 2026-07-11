"use client";

import * as React from "react";
import { HardDrive, Monitor, Cpu, Database } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function HardwarePage() {
  const specs = [
    { label: "Host Name", value: "DESKTOP-1EP019K", icon: Monitor },
    { label: "Processor", value: "AMD Ryzen 9 9950X3D (16C/32T)", icon: Cpu },
    { label: "Graphics Memory", value: "NVIDIA GeForce RTX 5080 (16 GB GDDR7)", icon: HardDrive },
    { label: "System RAM", value: "64 GB DDR5-4800 Corsair Vengeance", icon: Database },
  ];

  const partitions = [
    { drive: "C:", label: "System", size: "862 GB", free: "351 GB", model: "Samsung SSD 9100 PRO 2TB" },
    { drive: "D:", label: "Projects / Knowledge", size: "1,000 GB", free: "990 GB", model: "WD_BLACK SN850X 1TB" },
    { drive: "E:", label: "Secondary Storage", size: "931 GB", free: "931 GB", model: "WD SSD Partition" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Host Hardware</h1>
        <p className="text-sm text-muted-foreground">
          Workstation physical specs and logical storage configurations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Core Specs */}
        <Card>
          <CardHeader>
            <CardTitle>System Hardware Inventory</CardTitle>
            <CardDescription>Logical host properties compiled from system query.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {specs.map((spec, idx) => {
              const Icon = spec.icon;
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-accent/5 text-left">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded-md bg-primary/10 border border-primary/20 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{spec.label}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground truncate max-w-[200px]">{spec.value}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Disk Partitions */}
        <Card>
          <CardHeader>
            <CardTitle>Logical Partition Health</CardTitle>
            <CardDescription>NVMe disk volumes and filesystem blocks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {partitions.map((part, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-accent/5 text-left">
                <div className="flex flex-col space-y-0.5">
                  <span className="text-xs font-bold font-mono">Drive {part.drive} &bull; {part.label}</span>
                  <span className="text-[10px] text-muted-foreground">{part.model}</span>
                </div>
                <div className="flex flex-col items-end space-y-0.5">
                  <span className="text-xs font-bold text-foreground">{part.free} Free</span>
                  <span className="text-[9px] text-muted-foreground">of {part.size} Total</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
