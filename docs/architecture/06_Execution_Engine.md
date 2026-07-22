# PHASE 6 — EXECUTION ENGINE

## Overview
The Execution Engine is the deterministic heart of the platform. It translates JSON `ActionCommand`s into physical browser interactions using Playwright. It ensures that every action is executed reliably, waits for network idleness, and captures the resulting state before yielding control back to the orchestrator.

## Responsibilities
- Drive the headless browser.
- Manage execution parallelism across multiple worker nodes.
- Handle low-level network flakiness through robust retry logic.

## Interfaces
- `IWorkerPool`: Manages allocation of Playwright contexts.
- `ICommandExecutor`: Translates JSON commands to Playwright API calls.

## Data Structures
```typescript
interface ExecutionTask {
  taskId: string;
  command: ActionCommand;
  checkpointStateId: string; // The state to start from
  sessionConfig: SessionConfig;
}
```

## Failure Modes
- Playwright context crashes (Out of Memory).
- Target element becomes detached from DOM during interaction.

## Recovery
- **Crash**: Recreate context, replay actions from closest Checkpoint state.
- **Detached Element**: Catch Playwright's `TargetClosed` or `ElementDetached` errors, log as a state change (dynamic UI shift), and return failure to orchestrator.

## Tradeoffs
- **Always Waiting for Network Idle**: Slows down the execution loop significantly compared to blind clicking, but entirely eliminates the flakiness that plagues traditional UI tests.

## Implementation Notes
- Run workers as Docker containers mapped to an ECS cluster or Kubernetes deployment for easy horizontal scaling.
- Use Redis blocking pop (`BLPOP`) for extremely low latency task consumption.

## Future Evolution
- Implementing a persistent connection to the target backend database to pause/resume time (if target architecture allows) to prevent asynchronous timeouts.

---

## DETAILED EXECUTION MECHANISMS

### Navigation & Scheduling
The Orchestrator dictates *what* to do, the Engine schedules *when* to do it.
- **Scheduling**: Tasks are pushed to a Redis List (`queue:tasks`).
- **Parallelism**: Workers pull from the queue independently. Parallelism is limited by the number of active `CheckpointState`s available (you cannot parallelize linearly down a single undiscovered path).

### Retries & Error Handling
- Handled at the lowest possible layer. If an element isn't visible, Playwright retries internally (auto-waiting). If a command fails completely, it is returned to the Orchestrator with an error code.

### Resource Management & Cancellation
- Playwright Contexts are recycled to save memory, but fully cleared of cookies/storage between sessions.
- **Cancellation**: If a session is aborted, Redis PubSub broadcasts a cancellation signal. Workers listening on that channel immediately close their contexts.

### Checkpointing & Recovery
Workers do not maintain state. To execute a command on Node D, the worker must be given a Checkpoint (e.g., Node A) and the sequence of actions to reach Node D.

### Pseudocode: Execution Loop
```typescript
async function startWorkerLoop(redis: Redis, browser: Browser) {
  while (true) {
    const taskData = await redis.blpop('queue:tasks', 0);
    const task: ExecutionTask = JSON.parse(taskData[1]);
    
    // 1. Resource Allocation & Checkpoint Hydration
    const context = await browser.newContext();
    const page = await context.newPage();
    await hydrateState(page, task.checkpointStateId); // Login, set cookies
    
    // 2. Play path to target node
    await navigateToTargetNode(page, task.pathToTarget);
    
    // 3. Execute Command
    const result = await executeDeterministicAction(page, task.command);
    
    // 4. Capture state & cleanup
    const finalDomHash = hashDom(await page.content());
    await context.close();
    
    // 5. Report back
    await redis.rpush('queue:results', JSON.stringify({
      taskId: task.taskId,
      success: result.success,
      domHash: finalDomHash,
      evidence: result.evidenceIds
    }));
  }
}

async function executeDeterministicAction(page: Page, cmd: ActionCommand) {
  try {
    if (cmd.type === 'CLICK') {
      await page.click(cmd.selector, { timeout: 5000 });
    } else if (cmd.type === 'TYPE') {
      await page.fill(cmd.selector, cmd.value, { timeout: 5000 });
    }
    // CRITICAL: Wait for network to settle before declaring state transition complete
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
```
