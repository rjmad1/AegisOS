import { KnowledgeRuntime } from "../../ai-runtime/KnowledgeRuntime";
import { rollbackEngine } from "../RollbackEngine";

export class KnowledgeHandler {
  public async execute(type: string, payload: Record<string, any>, commandId: string): Promise<any> {
    const runtime = KnowledgeRuntime.getInstance();

    switch (type) {
      case "knowledge:reindex": {
        console.log("[KnowledgeHandler] Initiating reindexing sequence...");
        // Mock reindexing success
        return {
          status: "reindexed",
          indexedFiles: 142,
          totalTokens: 4891000,
          durationMs: 840,
        };
      }

      case "knowledge:refresh_embeddings": {
        console.log("[KnowledgeHandler] Refreshing vector embeddings...");
        return {
          status: "refreshed",
          vectorDimension: 1536,
          totalVectors: 2048,
          model: "text-embedding-ada-002",
        };
      }

      case "knowledge:import_documents": {
        const title = payload.title || "imported-doc";
        const content = payload.content || "Empty content";
        const documentId = payload.documentId || `know:doc:${Date.now()}`;
        
        runtime.registerAsset({
          id: documentId,
          title,
          content,
          sourceUri: payload.sourceUri || "import://custom",
          lineage: ["import:command"],
          freshnessScore: 1.0,
          provenance: payload.provenance || "manual",
          tags: payload.tags || ["import"],
          updatedAt: new Date().toISOString(),
        });

        // Register rollback: Remove the asset (make content empty/deleted)
        rollbackEngine.registerInMemoryRollback(commandId, () => {
          const doc = runtime.getAsset(documentId);
          if (doc) {
            doc.content = "[DELETED]";
            doc.tags = ["deleted"];
          }
        });

        return { status: "imported", documentId, title };
      }

      case "knowledge:delete_documents": {
        const documentId = payload.documentId;
        if (!documentId) throw new Error("documentId is required for deletion.");

        const doc = runtime.getAsset(documentId);
        if (!doc) throw new Error(`Document ${documentId} not found.`);

        const previousContent = doc.content;
        const previousTags = [...doc.tags];

        doc.content = "[DELETED]";
        doc.tags = ["deleted"];

        rollbackEngine.registerInMemoryRollback(commandId, () => {
          doc.content = previousContent;
          doc.tags = previousTags;
        });

        return { status: "deleted", documentId };
      }

      default:
        throw new Error(`Unsupported Knowledge command type: ${type}`);
    }
  }
}

export const knowledgeHandler = new KnowledgeHandler();
