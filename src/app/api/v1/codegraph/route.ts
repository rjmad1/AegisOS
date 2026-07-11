import { NextRequest, NextResponse } from "next/server";
import { codeGraphClient } from "@/infrastructure/codegraph/codegraph-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || searchParams.get("query") || "";
    const filePath = searchParams.get("filePath") || "";
    const type = searchParams.get("type") || "";
    const reindex = searchParams.get("reindex") === "true" || searchParams.get("index") === "true";

    if (reindex) {
      codeGraphClient.indexWorkspace();
      return NextResponse.json({
        success: true,
        message: "Codebase re-indexed successfully",
        symbolCount: codeGraphClient.getSymbols().length,
        dependencyCount: codeGraphClient.getDependencies().length
      });
    }

    if (filePath) {
      const deps = codeGraphClient.getFileDependencies(filePath);
      return NextResponse.json(deps);
    }

    if (q) {
      let symbols = codeGraphClient.querySymbol(q);
      if (type) {
        symbols = symbols.filter((s) => s.type === type);
      }
      return NextResponse.json(symbols);
    }

    // Default: list metadata and count
    return NextResponse.json({
      activeMcpServer: "codegraph",
      status: "connected",
      symbolsCount: codeGraphClient.getSymbols().length,
      dependenciesCount: codeGraphClient.getDependencies().length,
      capabilities: ["index_ast", "query_dependencies", "get_symbols"]
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
