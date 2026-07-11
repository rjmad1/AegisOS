import * as React from "react";
import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import { cn } from "@/utils/cn";
import { useAppStore } from "@/store/appStore";

// Import AG Grid styles
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

export interface DataGridProps extends AgGridReactProps {
  className?: string;
  containerClassName?: string;
  loading?: boolean;
}

export function DataGrid({
  className,
  containerClassName,
  loading = false,
  columnDefs,
  rowData,
  defaultColDef,
  ...props
}: DataGridProps) {
  const { theme } = useAppStore();

  const isDark = theme === "dark";

  const defaultCol = React.useMemo(() => {
    return {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 100,
      ...defaultColDef,
    };
  }, [defaultColDef]);

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-border glass-panel relative",
        containerClassName
      )}
      style={{ height: "450px" }}
    >
      <div
        className={cn(
          "w-full h-full transition-colors duration-150",
          isDark ? "ag-theme-alpine-dark" : "ag-theme-alpine",
          className
        )}
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultCol}
          animateRows={true}
          headerHeight={44}
          rowHeight={42}
          {...props}
        />
      </div>

      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-2">
            <span className="text-sm font-semibold text-muted-foreground animate-pulse">
              Loading grid data...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
