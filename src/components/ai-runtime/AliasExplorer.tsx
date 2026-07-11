"use client";

import * as React from "react";
import { Tag, HelpCircle, ArrowRight } from "lucide-react";
import type { ModelAlias } from "@/types/ai-runtime";

interface AliasExplorerProps {
  aliases: ModelAlias[];
}

export const AliasExplorer: React.FC<AliasExplorerProps> = ({ aliases }) => {
  return (
    <div className="space-y-4 text-left">
      <div className="overflow-x-auto rounded-lg border border-border/40 bg-card/40 backdrop-blur-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/40 bg-secondary/30">
              <th className="p-4 font-semibold text-foreground">Alias Target</th>
              <th className="p-4 font-semibold text-foreground text-center">Routes To</th>
              <th className="p-4 font-semibold text-foreground text-center">Gateway Provider</th>
              <th className="p-4 font-semibold text-foreground text-right">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {aliases.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                  No model aliases configured.
                </td>
              </tr>
            ) : (
              aliases.map((al, idx) => (
                <tr key={idx} className="hover:bg-secondary/10 transition-colors">
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 font-bold font-mono text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md">
                      <Tag className="h-3.5 w-3.5" /> {al.alias}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs text-foreground font-semibold bg-secondary/40 px-2 py-0.5 rounded border border-border/20">
                        {al.modelName}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center text-muted-foreground text-xs capitalize">
                    {al.providerId.replace("-ai-runtime", "").replace("-provider", "")}
                  </td>
                  <td className="p-4 text-right text-xs text-muted-foreground font-medium">
                    {al.description || "System configured proxy routing alias"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AliasExplorer;
