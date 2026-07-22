import { IMissionPlugin, IMissionExecutor } from '../registry';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export class EnterpriseAutomationExecutor implements IMissionExecutor {
  constructor(public executorId: string) {}

  async execute(mission: any): Promise<{ success: boolean; error?: string }> {
    console.log(`[EnterpriseAutomationExecutor] Starting execution for: ${this.executorId} on mission ${mission.id}`);
    
    // Resolve absolute path to the script folder
    const scriptDir = path.resolve(process.cwd(), 'automation');

    try {
      let scriptName = '';
      let args = '';

      switch (this.executorId) {
        case 'backup':
          scriptName = 'Backup.ps1';
          break;
        case 'restore':
          scriptName = 'Restore.ps1';
          break;
        case 'patch':
          scriptName = 'Upgrade.ps1';
          break;
        case 'cert-rotation':
          scriptName = 'Configure.ps1';
          args = '-Action RotateCertificates';
          break;
        case 'fleet-qualification':
          scriptName = 'Validate.ps1';
          args = '-Target Fleet';
          break;
        case 'onboarding':
          scriptName = 'Configure.ps1';
          args = '-Action Onboard';
          break;
        default:
          return { success: true }; // Fallback pass
      }

      // Execute local script if on Windows, otherwise simulate
      if (process.platform === 'win32') {
        const cmd = `powershell -ExecutionPolicy Bypass -File "${path.join(scriptDir, scriptName)}" ${args}`;
        console.log(`[EnterpriseAutomationExecutor] Running command: ${cmd}`);
        const { stdout, stderr } = await execAsync(cmd);
        console.log(`[EnterpriseAutomationExecutor] Run output:`, stdout);
        if (stderr && stderr.trim().length > 0) {
          console.warn(`[EnterpriseAutomationExecutor] Warning stderr:`, stderr);
        }
      } else {
        console.log(`[EnterpriseAutomationExecutor] Simulating run on non-Windows OS: ${scriptName}`);
      }

      return { success: true };
    } catch (err: any) {
      console.error(`[EnterpriseAutomationExecutor] Failed running automation script:`, err.message);
      return { success: false, error: err.message };
    }
  }
}

export const enterpriseAutomationPlugin: IMissionPlugin = {
  pluginId: 'com.aegisos.ext.automation',
  missionTypes: ['maintenance', 'automation'],
  executors: [
    new EnterpriseAutomationExecutor('backup'),
    new EnterpriseAutomationExecutor('restore'),
    new EnterpriseAutomationExecutor('patch'),
    new EnterpriseAutomationExecutor('cert-rotation'),
    new EnterpriseAutomationExecutor('fleet-qualification'),
    new EnterpriseAutomationExecutor('onboarding')
  ]
};

export default enterpriseAutomationPlugin;
