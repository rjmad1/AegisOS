/**
 * Evidence Graph — Progressive Chain-of-Trust
 *
 * Content-addressed, immutable evidence graph. Each node is SHA-256 hashed
 * with parent references, forming a Merkle-like integrity chain from
 * individual benchmark/chaos/endurance results up to the Release Manifest.
 *
 * Evidence is the system of record; documents are projections.
 */

import { createHash } from 'crypto';
import type { EvidenceBundle } from './evidence-provider';

// ---------------------------------------------------------------------------
// Evidence Node — a single entry in the graph
// ---------------------------------------------------------------------------

export interface EvidenceNode {
  /** SHA-256 hash of this node's content (excluding hash field) */
  hash: string;
  /** Bundle this node wraps */
  bundle: EvidenceBundle;
  /** Hashes of parent nodes (chain-of-trust) */
  parentHashes: string[];
  /** Depth in the graph (0 = leaf) */
  depth: number;
}

// ---------------------------------------------------------------------------
// Graph Verification Result
// ---------------------------------------------------------------------------

export interface GraphVerificationResult {
  isValid: boolean;
  totalNodes: number;
  validNodes: number;
  invalidNodes: string[];  // Hashes of nodes that failed verification
  rootHash: string | null;
  verifiedAt: string;
}

// ---------------------------------------------------------------------------
// Evidence Graph
// ---------------------------------------------------------------------------

export class EvidenceGraph {
  private nodes: Map<string, EvidenceNode> = new Map();

  /**
   * Add an evidence bundle to the graph.
   * Computes SHA-256 hash and links to parent nodes.
   */
  public addEvidence(
    bundle: EvidenceBundle,
    parentHashes: string[] = []
  ): EvidenceNode {
    // Validate parent references
    for (const ph of parentHashes) {
      if (!this.nodes.has(ph)) {
        console.warn(
          `[EvidenceGraph] Parent hash "${ph.slice(0, 12)}..." not found. Adding as dangling reference.`
        );
      }
    }

    const depth = parentHashes.length > 0
      ? Math.max(...parentHashes.map((h) => this.nodes.get(h)?.depth ?? 0)) + 1
      : 0;

    const hash = this.computeHash(bundle, parentHashes);

    const node: EvidenceNode = {
      hash,
      bundle,
      parentHashes,
      depth,
    };

    this.nodes.set(hash, node);
    return node;
  }

  /**
   * Compute the root hash of the entire evidence graph.
   * Root = hash of all leaf-to-root paths concatenated and hashed.
   */
  public computeRootHash(): string {
    if (this.nodes.size === 0) {
      return createHash('sha256').update('EMPTY_GRAPH').digest('hex');
    }

    // Find root nodes (nodes with no children referencing them)
    const childOf = new Set<string>();
    for (const node of this.nodes.values()) {
      for (const ph of node.parentHashes) {
        childOf.add(ph);
      }
    }

    const roots = Array.from(this.nodes.values())
      .filter((n) => {
        // A root is a node that is not a parent of any other node
        return !childOf.has(n.hash) || n.depth === Math.max(...Array.from(this.nodes.values()).map((nn) => nn.depth));
      })
      .sort((a, b) => a.hash.localeCompare(b.hash));

    // If no clear root, use all top-depth nodes
    const topDepth = Math.max(...Array.from(this.nodes.values()).map((n) => n.depth));
    const topNodes = Array.from(this.nodes.values())
      .filter((n) => n.depth === topDepth)
      .sort((a, b) => a.hash.localeCompare(b.hash));

    const combined = topNodes.map((n) => n.hash).join(':');
    return createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Verify integrity of the entire graph.
   * Recomputes every node's hash and checks against stored hash.
   */
  public verify(): GraphVerificationResult {
    const invalidNodes: string[] = [];

    for (const [storedHash, node] of this.nodes.entries()) {
      const recomputed = this.computeHash(node.bundle, node.parentHashes);
      if (recomputed !== storedHash) {
        invalidNodes.push(storedHash);
      }
    }

    return {
      isValid: invalidNodes.length === 0,
      totalNodes: this.nodes.size,
      validNodes: this.nodes.size - invalidNodes.length,
      invalidNodes,
      rootHash: this.nodes.size > 0 ? this.computeRootHash() : null,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Get all nodes in the graph.
   */
  public getNodes(): EvidenceNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get a node by hash.
   */
  public getNode(hash: string): EvidenceNode | undefined {
    return this.nodes.get(hash);
  }

  /**
   * Serialize the graph for persistence.
   */
  public serialize(): string {
    const nodes = Array.from(this.nodes.values()).map((n) => ({
      hash: n.hash,
      bundle: n.bundle,
      parentHashes: n.parentHashes,
      depth: n.depth,
    }));
    return JSON.stringify({ version: '1.0.0', nodes }, null, 2);
  }

  /**
   * Deserialize a previously serialized graph.
   */
  public static deserialize(json: string): EvidenceGraph {
    const data = JSON.parse(json) as {
      version: string;
      nodes: EvidenceNode[];
    };

    const graph = new EvidenceGraph();
    for (const node of data.nodes) {
      graph.nodes.set(node.hash, node);
    }
    return graph;
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private computeHash(
    bundle: EvidenceBundle,
    parentHashes: string[]
  ): string {
    const payload = JSON.stringify({
      id: bundle.id,
      category: bundle.category,
      domain: bundle.domain,
      contentHash: bundle.contentHash,
      createdAt: bundle.createdAt,
      gitSha: bundle.gitSha,
      platformVersion: bundle.platformVersion,
      generatorId: bundle.generatorId,
      generatorVersion: bundle.generatorVersion,
      parentHashes: [...parentHashes].sort(),
    });
    return createHash('sha256').update(payload).digest('hex');
  }
}

/**
 * Compute SHA-256 hash of arbitrary content for evidence integrity.
 */
export function computeContentHash(content: unknown): string {
  const serialized = typeof content === 'string'
    ? content
    : JSON.stringify(content);
  return createHash('sha256').update(serialized).digest('hex');
}
