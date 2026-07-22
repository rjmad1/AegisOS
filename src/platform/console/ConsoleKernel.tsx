"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { MetadataEngine, DomainMetadata } from "./MetadataEngine";
import { usePathname, useRouter } from "next/navigation";

type ConsoleKernelContextType = {
  activeDomain: string | null;
  activeEntity: string | null;
  domainSchema: DomainMetadata | null;
  loading: boolean;
};

const ConsoleKernelContext = createContext<ConsoleKernelContextType>({
  activeDomain: null,
  activeEntity: null,
  domainSchema: null,
  loading: true,
});

export const useConsoleKernel = () => useContext(ConsoleKernelContext);

export function ConsoleKernel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [contextState, setContextState] = useState<ConsoleKernelContextType>({
    activeDomain: null,
    activeEntity: null,
    domainSchema: null,
    loading: true,
  });

  useEffect(() => {
    // Basic routing interpretation for dynamic domain pages: /(console)/[domain]
    // Note: If using the Next.js app router, this can be parsed from params, but here we read the URL.
    const parts = pathname.split("/").filter(Boolean);
    // Path looks like /admin or /operations
    // Wait, the path inside (console) might be domain directly if it's top-level
    let domain = null;
    let entity = null;
    
    if (parts.length > 0) {
      domain = parts[0]; 
      if (parts.length > 1) {
        entity = parts[1];
      }
    }

    if (domain) {
      const schema = MetadataEngine.getSchema(domain);
      if (schema) {
        // Enforce basic permissions here in the future
        setContextState({
          activeDomain: domain,
          activeEntity: entity,
          domainSchema: schema,
          loading: false,
        });
      } else {
        // Not a metadata-driven domain, or not registered yet
        setContextState({
          activeDomain: domain,
          activeEntity: null,
          domainSchema: null,
          loading: false,
        });
      }
    } else {
      setContextState({
        activeDomain: null,
        activeEntity: null,
        domainSchema: null,
        loading: false,
      });
    }
  }, [pathname]);

  return (
    <ConsoleKernelContext.Provider value={contextState}>
      {children}
    </ConsoleKernelContext.Provider>
  );
}
