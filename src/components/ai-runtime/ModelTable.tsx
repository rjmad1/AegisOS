"use client";

import * as React from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import type { AIModel } from "@/types/ai-runtime";

interface ModelTableProps {
  rowData: AIModel[];
  onRowClick?: (modelId: string) => void;
}

export const ModelTable: React.FC<ModelTableProps> = ({ rowData, onRowClick }) => {
  const columnDefs: ColDef<AIModel>[] = [
    {
      field: "name",
      headerName: "Model Name",
      sortable: true,
      filter: true,
      flex: 2,
      cellRenderer: (params: any) => {
        return <span className="font-mono text-xs text-foreground font-semibold">{params.value}</span>;
      }
    },
    {
      field: "providerName",
      headerName: "Provider",
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params: any) => {
        return <span className="text-xs capitalize text-muted-foreground">{params.value}</span>;
      }
    },
    {
      field: "family",
      headerName: "Family",
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params: any) => {
        return <span className="text-xs text-foreground">{params.value}</span>;
      }
    },
    {
      field: "sizeDisplay",
      headerName: "Size",
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params: any) => {
        return <span className="text-xs text-foreground font-medium">{params.value}</span>;
      }
    },
    {
      field: "parameters",
      headerName: "Params",
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params: any) => {
        return <span className="text-xs text-foreground font-mono">{params.value}</span>;
      }
    },
    {
      field: "contextWindow.totalTokens",
      headerName: "Context Window",
      sortable: true,
      filter: true,
      flex: 1.2,
      cellRenderer: (params: any) => {
        return <span className="text-xs text-foreground font-mono">{params.value?.toLocaleString()} tokens</span>;
      }
    },
    {
      field: "status",
      headerName: "Status",
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params: any) => {
        const isRunning = params.value === "running";
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
              isRunning
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                : "bg-secondary/35 text-muted-foreground border-border/30"
            }`}
          >
            {isRunning ? "Running" : "Available"}
          </span>
        );
      }
    }
  ];

  const handleRowClicked = (event: any) => {
    if (event.data && onRowClick) {
      onRowClick(event.data.id);
    }
  };

  return (
    <div className="ag-theme-alpine-dark w-full h-[450px] border border-border/40 rounded-xl overflow-hidden shadow-lg bg-card/10 backdrop-blur-md">
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        rowSelection="single"
        onRowClicked={handleRowClicked}
        pagination={true}
        paginationPageSize={20}
        domLayout="normal"
        suppressCellFocus={true}
        defaultColDef={{
          resizable: true,
          minWidth: 100,
        }}
      />

      <style jsx global>{`
        .ag-theme-alpine-dark {
          --ag-background-color: transparent !important;
          --ag-header-background-color: rgba(30, 41, 59, 0.4) !important;
          --ag-border-color: rgba(255, 255, 255, 0.08) !important;
          --ag-row-hover-color: rgba(255, 255, 255, 0.03) !important;
          --ag-selected-row-background-color: rgba(139, 92, 246, 0.15) !important;
          --ag-font-family: var(--font-sans), system-ui, sans-serif !important;
          --ag-font-size: 13px !important;
        }
        .ag-root-wrapper {
          border: none !important;
        }
        .ag-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .ag-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>
    </div>
  );
};

export default ModelTable;
