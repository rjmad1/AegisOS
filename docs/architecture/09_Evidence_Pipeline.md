# PHASE 9 — EVIDENCE PIPELINE

## Overview
The Evidence Pipeline is responsible for gathering, compressing, and storing the immense volume of data generated during autonomous browser exploration. To prevent storage costs from exploding and to protect LLM token limits, evidence is strictly managed, heavily filtered, and intelligently summarized.

## Responsibilities
- Capture raw browser and system artifacts.
- Compress and deduplicate identical payloads.
- Upload large blobs to Object Storage (S3/MinIO) asynchronously.
- Summarize verbose logs for LLM consumption.

## Interfaces
- `IArtifactCollector`: Hooks into Playwright to capture traces/HAR.
- `IStorageBackend`: Interface for writing to S3/GCS.

## Data Structures
```typescript
interface EvidenceManifest {
  sessionId: string;
  nodeId: string;
  artifacts: {
    type: 'SCREENSHOT' | 'HAR' | 'TRACE' | 'CONSOLE';
    storageUri: string;
    sizeBytes: number;
    checksum: string;
  }[];
}
```

## Failure Modes
- **Storage Exhaustion**: Capturing full video for every worker rapidly fills local disk space before upload.
- **Token Overflow**: Attempting to pass a 10MB HAR file to an LLM context window.

## Recovery
- **Storage**: Stream artifacts directly to S3 where possible, or use aggressively aggressive log rotation and retention policies (e.g., delete on local disk immediately after successful S3 `200 OK`).
- **Token Overflow**: The pipeline truncates and uses the Evidence Collector Agent to summarize large text files before orchestration consumes them.

## Tradeoffs
- **Full Video vs. Trace**: Video is easy for humans to understand but huge and useless for LLMs. Playwright Traces are smaller, contain DOM snapshots, and are parseable. *Tradeoff*: Videos are only recorded if a critical validation failure occurs; Traces are recorded for all nodes.

## Implementation Notes
- Use `@playwright/test` trace recording capabilities.
- HAR files must have sensitive data (passwords, tokens) scrubbed deterministically before upload to S3.

## Future Evolution
- Implementing a vector database purely for evidence semantic search ("Find me all sessions where the console threw a specific React error").

---

## PIPELINE MECHANICS

### Artifacts Captured
1. **Screenshots**: Full page and element-specific (used by Visual Auditor).
2. **DOM**: The raw HTML snapshot.
3. **HAR**: Network traffic (used by API Auditor).
4. **Video**: WebM recordings (only on failure).
5. **Trace**: Playwright zip traces (combines DOM, network, and timeline).
6. **Logs**: Application backend logs (via Datadog API).
7. **Performance**: Lighthouse JSON outputs.
8. **Accessibility**: axe-core JSON outputs.
9. **Database snapshots**: Pre/post execution row counts (if enabled).
10. **Console**: Browser `console.error` and `console.warn` dumps.
11. **Network**: Filtered websocket payloads.

### Processing Pipeline
1. **Compression**: All text-based artifacts (HAR, DOM, Console) are gzip compressed immediately. Traces are naturally zipped.
2. **Deduplication**: If a DOM hash matches an already stored DOM for this session, the upload is skipped, and a pointer is used in the database.
3. **Chunking**: Huge text logs are chunked by timestamp to map directly to the specific execution window of an action.
4. **Summarization**: The deterministic chunk is passed to the Evidence Collector Agent, which distills "10,000 lines of Redux logs" into "User dispatched ADD_TO_CART 50 times in a loop."
5. **Storage**: Blobs uploaded to S3. Metadata and S3 URI saved in PostgreSQL.
6. **Retention**: S3 lifecycle policies auto-delete Video/Traces after 30 days. Summarized metadata in Postgres lives forever.
7. **Token Optimization**: The Orchestrator NEVER sends raw evidence to the Planner/Explorer agents, only the summarized insights.
