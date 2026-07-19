import { 
  UniversalExecutionDescriptor, 
  CognitiveDescriptor,
  ResolvedParticipantDescriptor
} from '../descriptors/types';

/**
 * Base Execution Descriptor used for standard AI agents
 */
const BASE_AI_UED: UniversalExecutionDescriptor = {
  identity: {
    id: 'base-ai-agent',
    name: 'Base AI Agent',
    description: 'Foundation for AI agents',
    type: 'AI_AGENT',
    version: '1.0.0'
  },
  trustLevel: 'SANDBOXED',
  security: {
    requiresApprovalForDestructiveActions: true,
    maxExecutionTimeMs: 3600000 // 1 hour
  },
  capabilities: ['read_file', 'write_file', 'run_command'],
  resourceBudgets: {
    maxComputeTokens: 100000,
    maxMemoryMb: 512,
    maxConcurrentTasks: 2
  },
  lifecycle: {
    autoRestart: false,
    maxRetries: 3
  },
  health: {
    checkIntervalMs: 60000
  },
  observability: {
    logLevel: 'INFO',
    enableTracing: true,
    tags: ['ai', 'agent']
  },
  policies: [],
  compatibility: {
    minKernelVersion: '1.0.0',
    requiredExtensions: ['COGNITIVE']
  }
};

/**
 * Domain Template: Planner
 */
export const PlannerTemplate: ResolvedParticipantDescriptor = {
  base: {
    ...BASE_AI_UED,
    identity: {
      ...BASE_AI_UED.identity,
      id: 'template-planner',
      name: 'Planner',
      description: 'Creates and breaks down complex execution plans.'
    },
    capabilities: ['workflow_generation', 'knowledge_read']
  },
  extensions: [
    {
      type: 'COGNITIVE',
      mission: 'Decompose complex goals into actionable step-by-step plans.',
      reasoningStrategies: ['decomposition', 'dependency-analysis'],
      planningStrategies: ['hierarchical-task-network', 'critical-path'],
      memoryDomains: ['working', 'knowledge', 'reflection'],
      delegationRules: [
        {
          taskType: '*',
          allowedTargetTypes: ['AI_AGENT', 'WORKFLOW'],
          requiresApproval: false
        }
      ],
      collaborationPolicies: [],
      humanApprovalRules: [],
      preferredModels: ['high-reasoning'],
      fallbackModels: ['standard'],
      confidenceThresholds: {
        minimumActionConfidence: 0.8,
        minimumResponseConfidence: 0.9
      }
    } as CognitiveDescriptor
  ]
};

/**
 * Domain Template: Researcher
 */
export const ResearcherTemplate: ResolvedParticipantDescriptor = {
  base: {
    ...BASE_AI_UED,
    identity: {
      ...BASE_AI_UED.identity,
      id: 'template-researcher',
      name: 'Researcher',
      description: 'Explores codebases and external knowledge to answer queries.'
    },
    capabilities: ['search_web', 'read_url', 'grep_search', 'list_dir', 'read_file']
  },
  extensions: [
    {
      type: 'COGNITIVE',
      mission: 'Gather and synthesize information to answer complex queries.',
      reasoningStrategies: ['information-gathering', 'synthesis', 'fact-checking'],
      planningStrategies: ['breadth-first-search', 'depth-first-search'],
      memoryDomains: ['working', 'knowledge'],
      delegationRules: [],
      collaborationPolicies: [],
      humanApprovalRules: [],
      preferredModels: ['fast-search', 'standard'],
      fallbackModels: ['high-reasoning'],
      confidenceThresholds: {
        minimumActionConfidence: 0.7,
        minimumResponseConfidence: 0.8
      }
    } as CognitiveDescriptor
  ]
};

/**
 * Domain Template: Coder
 */
export const CoderTemplate: ResolvedParticipantDescriptor = {
  base: {
    ...BASE_AI_UED,
    identity: {
      ...BASE_AI_UED.identity,
      id: 'template-coder',
      name: 'Coder',
      description: 'Writes, modifies, and tests software.'
    },
    capabilities: ['read_file', 'write_file', 'run_command', 'grep_search']
  },
  extensions: [
    {
      type: 'COGNITIVE',
      mission: 'Implement software requirements correctly and efficiently.',
      reasoningStrategies: ['code-generation', 'refactoring', 'debugging'],
      planningStrategies: ['test-driven', 'incremental'],
      memoryDomains: ['working', 'knowledge', 'episodic'],
      delegationRules: [],
      collaborationPolicies: [],
      humanApprovalRules: ['destructive-file-writes'],
      preferredModels: ['high-reasoning'],
      fallbackModels: ['standard'],
      confidenceThresholds: {
        minimumActionConfidence: 0.85,
        minimumResponseConfidence: 0.9
      }
    } as CognitiveDescriptor
  ]
};

/**
 * Domain Template: Reviewer
 */
export const ReviewerTemplate: ResolvedParticipantDescriptor = {
  base: {
    ...BASE_AI_UED,
    identity: {
      ...BASE_AI_UED.identity,
      id: 'template-reviewer',
      name: 'Reviewer',
      description: 'Reviews code, architecture, and plans for quality and security.'
    },
    capabilities: ['read_file', 'grep_search']
  },
  extensions: [
    {
      type: 'COGNITIVE',
      mission: 'Critique and evaluate artifacts for quality, security, and performance.',
      reasoningStrategies: ['critique', 'security-analysis', 'performance-analysis'],
      planningStrategies: ['checklist'],
      memoryDomains: ['working', 'knowledge'],
      delegationRules: [],
      collaborationPolicies: [],
      humanApprovalRules: [],
      preferredModels: ['high-reasoning'],
      fallbackModels: ['standard'],
      confidenceThresholds: {
        minimumActionConfidence: 0.9,
        minimumResponseConfidence: 0.95
      }
    } as CognitiveDescriptor
  ]
};
