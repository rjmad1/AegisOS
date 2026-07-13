// ============================================================================
// Knowledge API Router — GET/POST /api/v1/knowledge/[action] — Phase 9
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { knowledgeService } from "@/services/knowledge.service";
import { handleCaching } from "@/utils/api-helper";

import { semanticMemoryPlatform } from "@/platform/knowledge/SemanticMemory";
import { knowledgeGovernance } from "@/platform/knowledge/KnowledgeGovernance";
import { decisionIntelligence } from "@/platform/knowledge/DecisionIntelligence";
import { knowledgeAnalytics } from "@/platform/knowledge/KnowledgeAnalytics";
import { ragPlatform } from "@/platform/knowledge/RAGPlatform";
import { knowledgeFabricEngine } from "@/platform/knowledge/KnowledgeFabric";

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

      // --- New EKOS Action Handlers ---
      case "memories": {
        result = semanticMemoryPlatform.getMemoryCells();
        break;
      }

      case "governance": {
        const id = url.searchParams.get("id");
        if (id) {
          result = knowledgeGovernance.getRecord(id) || knowledgeGovernance.runQualityCheck(id);
        } else {
          result = knowledgeGovernance.getRecords();
        }
        break;
      }

      case "decisions": {
        result = decisionIntelligence.getDecisions();
        break;
      }

      case "analytics": {
        result = {
          readiness: knowledgeAnalytics.compileReadinessReport(),
          technicalDebt: knowledgeAnalytics.getTechnicalDebtRegister()
        };
        break;
      }

      case "rag-search": {
        const query = url.searchParams.get("query") || "";
        const type = (url.searchParams.get("type") || "hybrid") as any;
        result = await ragPlatform.retrieveAndGenerate(query, type);
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await params;

    if (action === "ingest") {
      const body = await request.json();
      const { id, type, name, content, owner, sourceUri, metadata } = body;

      if (!id || !type || !name || !content || !owner || !sourceUri) {
        return Response.json(
          { error: "Missing required fields: id, type, name, content, owner, sourceUri" },
          { status: 400 }
        );
      }

      const node = await knowledgeFabricEngine.ingestContent(
        id,
        type,
        name,
        content,
        owner,
        sourceUri,
        metadata || {}
      );

      return Response.json({ success: true, message: "Content ingested into Knowledge Graph", node });
    }

    if (action === "governance-check") {
      const body = await request.json();
      const { entityId } = body;
      if (!entityId) {
        return Response.json({ error: "Missing required field: entityId" }, { status: 400 });
      }

      const record = knowledgeGovernance.runQualityCheck(entityId);
      knowledgeGovernance.computeTrustScore(entityId);
      
      return Response.json({ success: true, record });
    }

    if (action === "merge") {
      const body = await request.json();
      const { masterId, duplicateId } = body;
      if (!masterId || !duplicateId) {
        return Response.json({ error: "Missing required fields: masterId, duplicateId" }, { status: 400 });
      }

      const success = knowledgeGovernance.mergeEntities(masterId, duplicateId);
      if (!success) {
        return Response.json({ error: "Failed to merge entities. Verify node IDs exist." }, { status: 400 });
      }

      return Response.json({ success: true, message: `Successfully merged duplicate ${duplicateId} into master ${masterId}` });
    }

    return Response.json({ error: `POST not supported on endpoint: '${action}'` }, { status: 405 });
  } catch (err: any) {
    console.error("[KnowledgeAPI POST] Error processing request:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
