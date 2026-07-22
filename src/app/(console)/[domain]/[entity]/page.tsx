"use client";

import React from "react";
import DomainEntityPage from "../page";

export default function EntityPage() {
  // Reuse the exact same component since it reads domain and entity from the URL via ConsoleKernel
  return <DomainEntityPage />;
}
