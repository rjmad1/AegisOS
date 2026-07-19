import { describe, it, expect } from 'vitest';
import { WorkflowBuilder, NodeBuilder } from './WorkflowBuilder';
import { WorkflowCompiler } from './WorkflowCompiler';

describe('WorkflowCompiler', () => {
  it('should compile a simple linear workflow', () => {
    const builder = WorkflowBuilder.create('Linear Test');
    
    builder.addNode(NodeBuilder.task('task1', 'core.task'));
    builder.addNode(NodeBuilder.task('task2', 'core.task').dependsOn('task1'));
    
    const graph = WorkflowCompiler.compile(builder);
    
    expect(graph.name).toBe('Linear Test');
    expect(graph.entryNodes).toContain('task1');
    expect(graph.nodes['task1']).toBeDefined();
    expect(graph.nodes['task2']).toBeDefined();
  });

  it('should detect cycles and throw an error', () => {
    const builder = WorkflowBuilder.create('Cycle Test');
    
    builder.addNode(NodeBuilder.task('nodeA', 'core.task').dependsOn('nodeB'));
    builder.addNode(NodeBuilder.task('nodeB', 'core.task').dependsOn('nodeA'));
    
    expect(() => {
      WorkflowCompiler.compile(builder);
    }).toThrow(/Cycle detected/);
  });

  it('should throw if a dependency does not exist', () => {
    const builder = WorkflowBuilder.create('Missing Dep Test');
    
    builder.addNode(NodeBuilder.task('nodeA', 'core.task').dependsOn('nonExistent'));
    
    expect(() => {
      WorkflowCompiler.compile(builder);
    }).toThrow(/depends on non-existent node/);
  });
});
