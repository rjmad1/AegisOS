import React, { useState, useEffect } from "react";
import { EntityMetadata } from "../../platform/console/MetadataEngine";
import { DataGrid } from "../ui/DataGrid";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

import { useQuery } from "@tanstack/react-query";

export function EntityGrid({ entityDef }: { entityDef: EntityMetadata }) {
  const { data = [], isLoading: loading, error } = useQuery({
    queryKey: ["entity", entityDef.id],
    queryFn: async () => {
      const res = await fetch(entityDef.apiEndpoint);
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      return Array.isArray(json) ? json : json[entityDef.id] || json.data || json.items || [];
    }
  });

  const columns = entityDef.list.columns.map(col => ({
    headerName: col.label,
    field: col.key,
    cellRenderer: (params: any) => {
      const val = params.value;
      if (col.type === "badge") {
        return <Badge variant="secondary" className="text-[10px] font-mono">{String(val)}</Badge>;
      }
      if (col.type === "status") {
        return <Badge variant={val === "healthy" || val === "active" ? "success" : "default"} className="text-[10px]">{String(val)}</Badge>;
      }
      return val;
    }
  }));

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground font-mono text-xs">Loading {entityDef.labelPlural}...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 font-mono text-xs">Error: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card/50 p-2 rounded-lg border border-border/40">
        <h3 className="text-sm font-bold ml-2 text-foreground">{entityDef.labelPlural} ({data.length})</h3>
        {entityDef.list.actions && (
          <div className="flex gap-2">
            {entityDef.list.actions.map(action => (
              <Button key={action.id} variant={action.type === "primary" ? "primary" : action.type === "danger" ? "destructive" : "secondary"} size="sm" className="text-xs">
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="border border-border/40 rounded-xl overflow-hidden bg-card/30">
        <DataGrid 
          rowData={data}
          columnDefs={columns}
          loading={loading}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          overlayNoRowsTemplate={`<span>No ${entityDef.labelPlural.toLowerCase()} found.</span>`}
        />
      </div>
    </div>
  );
}
