// ============================================================================
// Knowledge API Router — GET /api/v1/knowledge/[action]
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { knowledgeService } from "@/services/knowledge.service";
import { handleCaching } from "@/utils/api-helper";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await params;
    const url = new URL(request.url);

    let result: any = null;

    switch (action) {
      case "entities": {
        const id = url.searchParams.get("id");
        if (id) {
          result = await knowledgeService.getEntity(id);
          if (!result) {
            return Response.json({ error: `KnowledgeEntity '${id}' not found` }, { status: 404 });
          }
        } else {
          const type = url.searchParams.get("type") || undefined;
          const search = url.searchParams.get("search") || undefined;
          const page = parseInt(url.searchParams.get("page") || "1", 10);
          const pageSize = parseInt(url.searchParams.get("pageSize") || "25", 10);

          const allEntities = await knowledgeService.getEntities({ type, search });
          const total = allEntities.length;
          const paginated = allEntities.slice((page - 1) * pageSize, page * pageSize);

          result = {
            data: paginated,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
          };
        }
        break;
      }

      case "relationships": {
        result = await knowledgeService.getRelationships();
        break;
      }

      case "lineage": {
        const id = url.searchParams.get("id");
        if (!id) {
          return Response.json({ error: "Missing required query parameter: 'id'" }, { status: 400 });
        }
        result = await knowledgeService.getLineage(id);
        break;
      }

      case "collections": {
        result = await knowledgeService.getCollections();
        break;
      }

      case "topics": {
        result = await knowledgeService.getTopics();
        break;
      }

      case "timeline": {
        result = await knowledgeService.getTimeline();
        break;
      }

      case "graph": {
        result = await knowledgeService.getGraph();
        break;
      }

      case "references": {
        const id = url.searchParams.get("id");
        if (!id) {
          return Response.json({ error: "Missing required query parameter: 'id'" }, { status: 400 });
        }
        result = await knowledgeService.getReferences(id);
        break;
      }

      case "search": {
        const query = url.searchParams.get("search") || "";
        result = await knowledgeService.search(query);
        break;
      }

      default:
        return Response.json(
          { error: `Unknown knowledge action endpoint: '${action}'` },
          { status: 404 }
        );
    }

    return handleCaching(request, result);
  } catch (err: any) {
    console.error("[KnowledgeAPI] Error processing request:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
