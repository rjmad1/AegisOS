"use client";

import React from "react";
import { ConsoleShell } from "@/components/primitives/ConsoleShell";
import { EntityGrid } from "@/components/primitives/EntityGrid";
import { AICopilotPanel } from "@/components/primitives/AICopilotPanel";
import { useConsoleKernel } from "@/platform/console/ConsoleKernel";
import { useCERComponent } from "@/platform/console/CapabilityExtensionRuntime";

export default function DomainEntityPage() {
  const { domainSchema, activeEntity } = useConsoleKernel();

  if (!domainSchema) {
    return <ConsoleShell><></></ConsoleShell>;
  }

  // If no specific entity is selected in the URL (e.g. /admin instead of /admin/users),
  // we could show a domain dashboard, or redirect to the first entity.
  // For simplicity, we just display all entities in the domain as a dashboard if no activeEntity,
  // or render the specific entity grid if selected.

  return (
    <div className="flex w-full h-full">
      <div className="flex-1 min-w-0">
        <ConsoleShell>
          {activeEntity && domainSchema.entities[activeEntity] ? (
            <EntityGrid entityDef={domainSchema.entities[activeEntity]} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(domainSchema.entities).map(entity => (
                <div key={entity.id} className="p-4 rounded-xl border border-border/40 bg-card/20 shadow-sm hover:border-primary/40 transition-colors">
                  <h3 className="font-bold text-lg mb-1">{entity.labelPlural}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Manage {entity.labelPlural.toLowerCase()} in the {domainSchema.label} domain.</p>
                  <a href={`/${domainSchema.domain}/${entity.id}`} className="text-primary text-sm font-semibold">View {entity.labelPlural} &rarr;</a>
                </div>
              ))}
            </div>
          )}
        </ConsoleShell>
      </div>
      
      {/* Adaptive Experience Layer: Dynamic side panels */}
      <div className="w-80 border-l border-border/40 hidden xl:block">
        <AdaptiveSidebar />
      </div>
    </div>
  );
}

function AdaptiveSidebar() {
  const DynamicSidebar = useCERComponent("core-ai", "CopilotPanel");
  
  // If the extension isn't providing the sidebar, fallback to default primitive
  if (DynamicSidebar.name === "Component" || typeof DynamicSidebar === 'function' && DynamicSidebar.toString().includes("CER Error")) {
    return <AICopilotPanel />;
  }
  
  // eslint-disable-next-line react-hooks/static-components
  return <DynamicSidebar />;
}
