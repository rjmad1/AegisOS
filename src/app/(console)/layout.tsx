"use client";

import * as React from "react";
import { AppShell } from "@/components/shell/AppShell";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
