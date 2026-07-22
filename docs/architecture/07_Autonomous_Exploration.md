# PHASE 7 — AUTONOMOUS EXPLORATION

## Overview
Autonomous Exploration defines how the platform discovers the application's state space. Instead of random monkey-testing, the system constructs a formal mathematical graph (nodes = states, edges = actions). The LLM Explorer Agent is invoked to evaluate unvisited edges, preventing redundant loops and ensuring deep traversal of the application logic.

## Responsibilities
- Discover and catalogue interactable UI elements.
- Construct and persist the state graph.
- Determine when exploration is complete (coverage targets met).

## Interfaces
- `IGraphBuilder`: Adds nodes/edges to the database.
- `IHeuristicEngine`: Scores unvisited edges to prioritize exploration.

## Data Structures
```typescript
interface ExplorationGraph {
  nodes: Map<string, DOMNode>;
  edges: Map<string, ActionEdge>;
  unvisitedEdges: ActionEdge[];
  coverageMetric: number; // 0.0 to 1.0
}
```

## Failure Modes
- **Graph Explosion**: A page with a constantly updating timestamp generates a new unique DOM hash every second, creating infinite nodes.

## Recovery
- Apply structural normalization: Strip `id`, `class` (if auto-generated like Tailwind/CSS-in-JS hashes), `data-reactid`, and text content of volatile fields *before* generating the DOM hash.

## Tradeoffs
- **Breadth-First vs Depth-First**: Neither is ideal for business apps. *Tradeoff*: A priority-queue heuristic approach is used. The LLM assigns a "business value" score to edges (e.g., clicking "Checkout" is higher value than clicking "Sort by Name"). This costs LLM tokens to score edges, but finds critical bugs faster.

## Implementation Notes
- Exploration stops when the priority queue of unvisited edges is empty, or when the `MaxTokensPerSession` budget is hit.

## Future Evolution
- Reinforcement learning: Training a lightweight local model to score edges based on historical defect discovery rates across all projects.

---

## EXPLORATION ALGORITHMS

### Navigation Discovery & Graph Construction
When a worker completes an action, it parses the resulting DOM.
1. Extract all interactable elements (`a`, `button`, `input`, elements with `click` listeners).
2. Generate an `Edge` for each element.
3. If the normalized DOM hash is new, create a `Node` and link the edges.
4. Mark the edge that led to this node as `visited`.

### Workflow Discovery & Business Rule Inference
The Planner agent uses LLM context to infer workflows. If the app is an e-commerce site, the Planner injects a heuristic to highly prioritize the "Add to Cart" -> "Checkout" path.

### Duplicate Avoidance & State Tracking
The `State Manager` maintains a strict set of discovered `DOMHash`es. If an action results in a known `DOMHash`, the graph links the edge back to the existing node, closing the loop.

### Stopping Criteria & Coverage Estimation
- **Criteria 1**: Configured time/token budget exhausted.
- **Criteria 2**: 100% of discovered edges have been visited up to a maximum depth of `N`.
- **Coverage**: Estimated by comparing the number of visited interactable elements vs total interactable elements discovered globally.

### Pseudocode: Exploration Loop
```typescript
async function autonomousExplore(session: Session) {
  let graph = await stateManager.loadGraph(session.id);
  
  while (!stoppingCriteriaMet(session, graph)) {
    const unvisitedEdges = graph.getUnvisitedEdges();
    if (unvisitedEdges.length === 0) break;

    // 1. Prioritize exploration targets (LLM Heuristic or Simple BFS)
    const targetEdge = await explorerAgent.scoreAndSelectEdge(unvisitedEdges);
    
    // 2. Dispatch to Execution Engine
    const result = await executionEngine.execute(targetEdge);
    
    // 3. Process Result
    const resultingDomHash = normalizeAndHash(result.domContent);
    const isNewNode = !graph.hasNode(resultingDomHash);
    
    // 4. Update Graph
    if (isNewNode) {
      const interactables = extractInteractables(result.domContent);
      graph.addNode(resultingDomHash, interactables);
    }
    graph.markEdgeVisited(targetEdge.id, resultingDomHash);
    await stateManager.saveGraph(graph);
    
    // 5. Check coverage
    session.updateCoverage(graph.calculateCoverage());
  }
}

function normalizeAndHash(html: string): string {
  // Strip non-structural attributes to prevent state explosion
  const structuralHtml = html.replace(/id="[^"]*"/g, '')
                             .replace(/class="[^"]*"/g, '')
                             .replace(/>([^<]*)</g, '><'); // Strip text
  return crypto.createHash('sha256').update(structuralHtml).digest('hex');
}
```
