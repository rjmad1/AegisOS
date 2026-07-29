import { describe, it, expect } from 'vitest';
import { VisualAgentCompiler, CanvasWorkflowDefinition } from './VisualAgentCompiler';

describe('VisualAgentCompiler', () => {
  it('should compile a simple linear canvas graph correctly', () => {
    const canvas: CanvasWorkflowDefinition = {
      name: 'Test Agent Flow',
      description: 'Linear test flow',
      nodes: [
        {
          id: 'node-1',
          type: 'agent',
          label: 'Planner Agent',
          data: { agentRole: 'planner' },
        },
        {
          id: 'node-2',
          type: 'task',
          label: 'Code Generator',
          data: { action: 'generate' },
        },
      ],
      connections: [
        {
          id: 'conn-1',
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2',
          conditionType: 'success',
        },
      ],
    };

    const graph = VisualAgentCompiler.compileCanvas(canvas);

    expect(graph.name).toBe('Test Agent Flow');
    expect(Object.keys(graph.nodes)).toHaveLength(2);
    expect(graph.entryNodes).toEqual(['node-1']);
    expect(graph.nodes['node-2'].dependencies).toHaveLength(1);
    expect(graph.nodes['node-2'].dependencies[0].nodeId).toBe('node-1');
  });

  it('should detect cycles in visual canvas graphs', () => {
    const cyclicCanvas: CanvasWorkflowDefinition = {
      name: 'Cyclic Flow',
      nodes: [
        { id: 'a', type: 'task', label: 'Node A', data: {} },
        { id: 'b', type: 'task', label: 'Node B', data: {} },
      ],
      connections: [
        { id: 'c1', sourceNodeId: 'a', targetNodeId: 'b' },
        { id: 'c2', sourceNodeId: 'b', targetNodeId: 'a' },
      ],
    };

    expect(() => VisualAgentCompiler.compileCanvas(cyclicCanvas)).toThrow(/Cycle detected/);
  });
});
