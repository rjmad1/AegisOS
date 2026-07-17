import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Service Terminator Chaos Script
 * 
 * Purpose: Simulates sudden process termination of critical components (e.g., Ollama)
 * to verify that self-healer.ts and platform diagnostic services gracefully recover
 * and record the incident without data corruption.
 */
async function runChaos() {
  console.log('🛡️ [Chaos Engineering] Initiating Service Terminator...');

  const servicesToTerminate = ['ollama', 'litellm'];
  
  for (const service of servicesToTerminate) {
    try {
      console.log(`[Chaos] Attempting to terminate processes matching: ${service}`);
      // Windows taskkill command for chaos engineering simulation
      const { stdout } = await execAsync(`taskkill /F /IM ${service}.exe /T`);
      console.log(`[Chaos] Success: ${stdout.trim()}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        console.log(`[Chaos] Note: Service ${service} is not currently running.`);
      } else {
        console.error(`[Chaos] Error terminating ${service}:`, error);
      }
    }
  }

  console.log('✅ [Chaos Engineering] Service termination simulation complete.');
  console.log('🔍 [Action] Please verify telemetry and self-healer logs for recovery metrics.');
}

runChaos().catch(console.error);
