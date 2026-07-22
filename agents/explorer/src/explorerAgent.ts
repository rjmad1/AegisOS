import { BaseAgent, AgentContext } from '@platform/agents-core';
import { NavigationEdge, ActionCommand } from '@platform/shared-contracts';

export interface ExplorerInput {
  currentUrl: string;
  unvisitedEdges: NavigationEdge[];
  activeGoal?: string;
}

export class ExplorerAgent extends BaseAgent<ExplorerInput, NavigationEdge> {
  name = 'ExplorerAgent';

  protected buildPrompt(input: ExplorerInput, context: AgentContext): string {
    const candidateSummary = input.unvisitedEdges.map((e, idx) => {
      const cmd = e.actionTaken;
      return `[Edge ${idx}] ID: ${e.edgeId} | Action: ${cmd.commandType} | Selector: ${cmd.selector || 'N/A'} | Value: ${cmd.value || 'N/A'}`;
    }).join('\n');

    return `
You are the Strategic Explorer Agent for Autonomous Web Testing.
Current Page URL: ${input.currentUrl}
Active Goal: ${input.activeGoal || 'General State Discovery'}

Evaluate the unvisited graph edges below. Select the single edge that is most likely to uncover critical business logic or move closer to the active goal.
Avoid redundant or low-value edges (e.g., repeating 'Terms of Service' footer links).

Unvisited Edges:
${candidateSummary}

Return JSON strictly in the format:
{ "selectedEdgeId": "<edgeId>", "reasoning": "<why this edge was selected>" }
    `.trim();
  }

  protected parseResponse(llmResponse: string): NavigationEdge {
    try {
      const parsed = JSON.parse(llmResponse);
      if (parsed && parsed.selectedEdgeId) {
        // Will be matched against edges by caller or returned directly
      }
    } catch {
      // Fallback
    }

    throw new Error('Parse failure');
  }

  async selectEdge(input: ExplorerInput, context: AgentContext): Promise<NavigationEdge> {
    if (input.unvisitedEdges.length === 0) {
      throw new Error('No unvisited edges available');
    }

    try {
      const prompt = this.buildPrompt(input, context);
      const raw = await this.callLlmApi(prompt);
      const parsed = JSON.parse(raw);
      if (parsed && parsed.selectedEdgeId) {
        const found = input.unvisitedEdges.find((e) => e.edgeId === parsed.selectedEdgeId);
        if (found) return found;
      }
    } catch {
      // Fallback to highest priority heuristic
    }

    return this.fallback(input, new Error('Fallback used'));
  }

  protected fallback(input: ExplorerInput, error: Error): NavigationEdge {
    // Deterministic fallback: pick the first unvisited edge
    return input.unvisitedEdges[0];
  }
}
