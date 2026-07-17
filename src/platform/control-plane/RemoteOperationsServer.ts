// src/platform/control-plane/RemoteOperationsServer.ts
import { platformLifecycleOrchestrator } from './PlatformLifecycleOrchestrator';
import { platformServiceManager } from './PlatformServiceManager';
import { platformDiagnosticsEngine } from './PlatformDiagnosticsEngine';
import { securityOperationsManager } from './SecurityOperationsManager';
import { backupRecoveryCoordinator } from './BackupRecoveryCoordinator';
import { InfrastructureDiscoveryEngine } from './InfrastructureDiscoveryEngine';

export class RemoteOperationsServer {
  private static instance: RemoteOperationsServer | null = null;
  private discovery = InfrastructureDiscoveryEngine.getInstance();

  private constructor() {}

  public static getInstance(): RemoteOperationsServer {
    if (!RemoteOperationsServer.instance) {
      RemoteOperationsServer.instance = new RemoteOperationsServer();
    }
    return RemoteOperationsServer.instance;
  }

  /**
   * Resolves a natural-language operational query into a strongly typed command,
   * then dispatches it to the control plane.
   */
  public async executeCommand(command: string): Promise<{ success: boolean; output: string; data?: any }> {
    const typedCmd = this.translateToTypedCommand(command);
    console.log(`[CommandFramework] NL "${command}" resolved to: "${typedCmd}"`);
    return this.dispatchTypedCommand(typedCmd);
  }

  private translateToTypedCommand(nl: string): string {
    const raw = nl.trim().toLowerCase();

    if (raw.includes('start') && (raw.includes('platform') || raw.includes('ai'))) {
      return 'Platform.Start()';
    }
    if (raw.includes('stop') && (raw.includes('platform') || raw.includes('everything') || raw.includes('safely'))) {
      return 'Platform.Stop()';
    }
    if (raw.includes('restart') && (raw.includes('platform') || raw.includes('everything'))) {
      return 'Platform.Restart()';
    }
    if (raw.includes('security audit') || raw.includes('audit security') || raw.includes('security scan')) {
      return 'Platform.Security.Scan()';
    }
    if (raw.includes('backup') && (raw.includes('platform') || raw.includes('database') || raw.includes('system'))) {
      return 'Platform.Backup()';
    }
    if (raw.includes('restore') && raw.includes('backup')) {
      // Find backup ID inside string
      const match = raw.match(/backup-\S+/);
      return match ? `Platform.Restore("${match[0]}")` : 'Platform.Restore()';
    }
    if (raw.startsWith('restart ')) {
      const name = raw.replace('restart ', '').trim();
      return `Platform.Service.Restart("${name}")`;
    }
    if (raw.startsWith('start ')) {
      const name = raw.replace('start ', '').trim();
      return `Platform.Service.Start("${name}")`;
    }
    if (raw.startsWith('stop ')) {
      const name = raw.replace('stop ', '').trim();
      return `Platform.Service.Stop("${name}")`;
    }
    if (raw.startsWith('diagnose ')) {
      const target = raw.replace('diagnose ', '').trim();
      return `Platform.Diagnostics.Run("${target}")`;
    }
    if (raw.includes('why is inference slow') || raw.includes('slow inference')) {
      return 'Platform.Diagnostics.Run("performance")';
    }
    if (raw.includes('gpu utilization') || raw.includes('gpu high')) {
      return 'Platform.Diagnostics.Run("gpu")';
    }
    if (raw.includes('show model health') || raw.includes('model status')) {
      return 'Platform.Diagnostics.Run("models")';
    }
    if (raw.includes('enter maintenance mode')) {
      return 'Platform.Maintenance.Enter()';
    }

    return `Platform.Unknown("${nl}")`;
  }

  private async dispatchTypedCommand(typedCmd: string): Promise<{ success: boolean; output: string; data?: any }> {
    if (typedCmd === 'Platform.Start()') {
      const ok = await platformLifecycleOrchestrator.startPlatform();
      return { success: ok, output: ok ? 'Platform startup initiated successfully.' : 'Platform startup failed.' };
    }
    if (typedCmd === 'Platform.Stop()') {
      const ok = await platformLifecycleOrchestrator.safeShutdown();
      return { success: ok, output: ok ? 'Safe platform shutdown initiated.' : 'Safe platform shutdown failed.' };
    }
    if (typedCmd === 'Platform.Restart()') {
      const ok = await platformLifecycleOrchestrator.restartPlatform();
      return { success: ok, output: ok ? 'Platform restart completed.' : 'Platform restart failed.' };
    }
    if (typedCmd === 'Platform.Security.Scan()') {
      const posture = await securityOperationsManager.getSecurityPosture();
      return {
        success: true,
        output: `Security Audit Complete. Scorecard: ${posture.score}/100. Controls validated: ${posture.checks.length}.`,
        data: posture
      };
    }
    if (typedCmd === 'Platform.Backup()') {
      const backup = await backupRecoveryCoordinator.createBackup('full');
      return { success: backup.status === 'success', output: `Backup complete. Saved snapshot to: ${backup.location}.`, data: backup };
    }
    if (typedCmd.startsWith('Platform.Restore(')) {
      const idMatch = typedCmd.match(/"([^"]+)"/);
      if (!idMatch) return { success: false, output: 'Restore failed: Missing backup ID parameter.' };
      const backupId = idMatch[1];
      const ok = await backupRecoveryCoordinator.restoreFromBackup(backupId);
      return { success: ok, output: ok ? `Successfully restored system state to ${backupId}.` : `Restore failed for ${backupId}.` };
    }
    if (typedCmd.startsWith('Platform.Service.Restart(')) {
      const nameMatch = typedCmd.match(/"([^"]+)"/);
      const serviceName = nameMatch ? nameMatch[1] : '';
      const compId = this.findComponentId(serviceName);
      if (!compId) return { success: false, output: `Service "${serviceName}" not found.` };
      const ok = await platformServiceManager.restartService(compId);
      return { success: ok, output: ok ? `Successfully restarted service "${serviceName}".` : `Failed to restart "${serviceName}".` };
    }
    if (typedCmd.startsWith('Platform.Service.Start(')) {
      const nameMatch = typedCmd.match(/"([^"]+)"/);
      const serviceName = nameMatch ? nameMatch[1] : '';
      const compId = this.findComponentId(serviceName);
      if (!compId) return { success: false, output: `Service "${serviceName}" not found.` };
      const ok = await platformServiceManager.startService(compId);
      return { success: ok, output: ok ? `Successfully started service "${serviceName}".` : `Failed to start "${serviceName}".` };
    }
    if (typedCmd.startsWith('Platform.Service.Stop(')) {
      const nameMatch = typedCmd.match(/"([^"]+)"/);
      const serviceName = nameMatch ? nameMatch[1] : '';
      const compId = this.findComponentId(serviceName);
      if (!compId) return { success: false, output: `Service "${serviceName}" not found.` };
      const ok = await platformServiceManager.stopService(compId);
      return { success: ok, output: ok ? `Successfully stopped service "${serviceName}".` : `Failed to stop "${serviceName}".` };
    }
    if (typedCmd.startsWith('Platform.Diagnostics.Run(')) {
      const targetMatch = typedCmd.match(/"([^"]+)"/);
      const target = targetMatch ? targetMatch[1] : 'platform';
      const report = await platformDiagnosticsEngine.diagnose(target);
      return {
        success: true,
        output: `Diagnostics Complete: ${report.target}\nRoot Cause: ${report.rootCause}\nRecommended Fix: ${report.recommendedFix}`,
        data: report
      };
    }
    if (typedCmd === 'Platform.Maintenance.Enter()') {
      platformLifecycleOrchestrator.enterMaintenanceMode();
      return { success: true, output: 'Platform successfully transitioned to MAINTENANCE mode.' };
    }

    return {
      success: false,
      output: `Unknown control plane operational command: "${typedCmd}".`
    };
  }

  private findComponentId(name: string): string | null {
    const list = this.discovery.getAllComponents();
    const idMatch = list.find(c => c.id.toLowerCase() === name);
    if (idMatch) return idMatch.id;

    const fuzzy = list.find(c => c.name.toLowerCase().includes(name) || c.id.toLowerCase().includes(name));
    if (fuzzy) return fuzzy.id;

    return null;
  }
}
export const remoteOperationsServer = RemoteOperationsServer.getInstance();
export default remoteOperationsServer;
