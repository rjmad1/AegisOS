// src/platform/control-plane/DependencyGraphSolver.ts
import { DependencyLink } from './types';

export class DependencyGraphSolver {
  private adjacencyList: Map<string, Set<string>> = new Map();
  private reverseAdjacencyList: Map<string, Set<string>> = new Map();

  public addNode(id: string): void {
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, new Set());
    }
    if (!this.reverseAdjacencyList.has(id)) {
      this.reverseAdjacencyList.set(id, new Set());
    }
  }

  public addEdge(from: string, to: string): void {
    this.addNode(from);
    this.addNode(to);
    this.adjacencyList.get(from)!.add(to);
    this.reverseAdjacencyList.get(to)!.add(from);
  }

  public removeNode(id: string): void {
    this.adjacencyList.delete(id);
    this.reverseAdjacencyList.delete(id);
    for (const edges of this.adjacencyList.values()) {
      edges.delete(id);
    }
    for (const edges of this.reverseAdjacencyList.values()) {
      edges.delete(id);
    }
  }

  public getDependencies(id: string): string[] {
    return Array.from(this.adjacencyList.get(id) || []);
  }

  public getRecursiveDependencies(id: string, visited = new Set<string>()): string[] {
    if (visited.has(id)) return [];
    visited.add(id);

    const direct = this.getDependencies(id);
    const recursive: string[] = [...direct];

    for (const dep of direct) {
      const subDeps = this.getRecursiveDependencies(dep, visited);
      recursive.push(...subDeps);
    }

    return Array.from(new Set(recursive));
  }

  public getDependents(id: string): string[] {
    return Array.from(this.reverseAdjacencyList.get(id) || []);
  }

  public getRecursiveDependents(id: string, visited = new Set<string>()): string[] {
    if (visited.has(id)) return [];
    visited.add(id);

    const direct = this.getDependents(id);
    const recursive: string[] = [...direct];

    for (const dep of direct) {
      const subDeps = this.getRecursiveDependents(dep, visited);
      recursive.push(...subDeps);
    }

    return Array.from(new Set(recursive));
  }

  public hasCycle(): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const isCyclicUtil = (node: string): boolean => {
      if (recStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recStack.add(node);

      const neighbors = this.adjacencyList.get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (isCyclicUtil(neighbor)) return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const node of this.adjacencyList.keys()) {
      if (isCyclicUtil(node)) return true;
    }

    return false;
  }

  /**
   * Returns nodes sorted topologically: dependencies first, then dependents.
   * e.g., if A depends on B (B -> A), B appears before A.
   */
  public getTopologicalSort(): string[] {
    if (this.hasCycle()) {
      throw new Error('Circular dependency detected in graph solver. Topological sort aborted.');
    }

    const visited = new Set<string>();
    const stack: string[] = [];

    const helper = (node: string) => {
      visited.add(node);
      const neighbors = this.adjacencyList.get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            helper(neighbor);
          }
        }
      }
      stack.push(node);
    };

    for (const node of this.adjacencyList.keys()) {
      if (!visited.has(node)) {
        helper(node);
      }
    }

    // Topological order is stack reversed
    return stack.reverse();
  }

  /**
   * Reverse topological sort is used for shutdown sequencing (dependents first, dependencies last).
   */
  public getReverseTopologicalSort(): string[] {
    return [...this.getTopologicalSort()].reverse();
  }

  public visualize(): DependencyLink[] {
    const links: DependencyLink[] = [];
    for (const [from, neighbors] of this.adjacencyList.entries()) {
      for (const to of neighbors) {
        links.push({ from, to });
      }
    }
    return links;
  }

  public clear(): void {
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
  }
}
