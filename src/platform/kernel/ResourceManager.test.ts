import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceManager } from './ResourceManager';

describe('Platform Resource Manager (PRM)', () => {
  let prm: ResourceManager;

  beforeEach(() => {
    // Isolated instance for clean tests
    prm = new ResourceManager({
      cpuCores: 4,
      memoryMb: 1024,
      vramMb: 2048,
      gpuCount: 1,
      tokens: 100,
    });
  });

  it('should acquire resources synchronously if available', () => {
    const token = prm.acquire({ cpuCores: 2, memoryMb: 512 });
    expect(token).not.toBeNull();
    expect(token?.id).toBeDefined();
    
    const util = prm.getUtilization();
    expect(util.cpuCores).toBe(2);
    expect(util.memoryMb).toBe(512);
  });

  it('should reject synchronous acquisition if budgets exceeded', () => {
    const token1 = prm.acquire({ cpuCores: 3 });
    expect(token1).not.toBeNull();

    const token2 = prm.acquire({ cpuCores: 2 }); // 3 + 2 = 5 > 4
    expect(token2).toBeNull();
    
    const util = prm.getUtilization();
    expect(util.cpuCores).toBe(3); // Only the first request succeeded
  });

  it('should release resources and make them available again', () => {
    const token1 = prm.acquire({ cpuCores: 4 });
    expect(token1).not.toBeNull();
    
    let util = prm.getUtilization();
    expect(util.cpuCores).toBe(4);

    token1?.release();
    
    util = prm.getUtilization();
    expect(util.cpuCores).toBe(0);

    const token2 = prm.acquire({ cpuCores: 4 });
    expect(token2).not.toBeNull();
  });

  it('should be idempotent on release', () => {
    const token = prm.acquire({ cpuCores: 2 });
    token?.release();
    token?.release(); // double free should be safe

    const util = prm.getUtilization();
    expect(util.cpuCores).toBe(0); // Not -2
  });

  it('should queue async requests and fulfill when resources free up', async () => {
    // Max out CPU
    const token1 = prm.acquire({ cpuCores: 4 });
    expect(token1).not.toBeNull();

    let resolved = false;
    const asyncAcquire = prm.acquireAsync({ cpuCores: 2 }).then(t => {
      resolved = true;
      return t;
    });

    // Wait a tick to ensure it's queued and not resolved
    await new Promise(r => setTimeout(r, 10));
    expect(resolved).toBe(false);

    // Free resources
    token1?.release();

    // Now it should resolve
    const token2 = await asyncAcquire;
    expect(token2).not.toBeNull();
    expect(resolved).toBe(true);

    const util = prm.getUtilization();
    expect(util.cpuCores).toBe(2);
  });

  it('should timeout async requests if resources do not free up', async () => {
    prm.acquire({ cpuCores: 4 });

    const token = await prm.acquireAsync({ cpuCores: 2 }, 50); // 50ms timeout
    expect(token).toBeNull();
  });
});
