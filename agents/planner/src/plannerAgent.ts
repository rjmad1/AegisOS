import { BaseAgent, AgentContext } from '@platform/agents-core';
import { WorkflowGoal } from '@platform/shared-contracts';

export interface PlannerInput {
  targetUrl: string;
  applicationDescription?: string;
  userRoles?: string[];
}

export class PlannerAgent extends BaseAgent<PlannerInput, WorkflowGoal[]> {
  name = 'PlannerAgent';

  protected buildPrompt(input: PlannerInput, context: AgentContext): string {
    return `
You are the Principal QA System Planner.
Analyze the target application URL: ${input.targetUrl}.
Description: ${input.applicationDescription || 'Enterprise web application'}
User Roles: ${input.userRoles?.join(', ') || 'Standard User'}

Deconstruct this application into 3 high-priority, distinct business workflow goals to explore.
Return JSON output formatted as:
[
  { "goalId": "goal-1", "description": "...", "priority": 10 }
]
    `.trim();
  }

  protected parseResponse(llmResponse: string): WorkflowGoal[] {
    try {
      const parsed = JSON.parse(llmResponse);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => ({
          goalId: item.goalId || `goal-${idx + 1}`,
          sessionId: '',
          description: item.description || 'Explore page navigation',
          priority: item.priority || 5,
          status: 'NOT_STARTED',
        }));
      }
    } catch {
      // Fallback
    }

    return this.fallback({ targetUrl: '' }, new Error('Parse error'));
  }

  protected fallback(input: PlannerInput, error: Error): WorkflowGoal[] {
    return [
      {
        goalId: 'goal-fallback-1',
        sessionId: '',
        description: 'Explore main landing page links and primary navigation bar',
        priority: 10,
        status: 'NOT_STARTED',
      },
      {
        goalId: 'goal-fallback-2',
        sessionId: '',
        description: 'Locate and test authentication/login mechanisms',
        priority: 8,
        status: 'NOT_STARTED',
      },
    ];
  }
}
