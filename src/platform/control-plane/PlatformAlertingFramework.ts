// src/platform/control-plane/PlatformAlertingFramework.ts
import { PlatformAlert } from './types';
import { eventPlatform } from '../event-bus/EventPlatform';
import { PlatformServiceManager } from './PlatformServiceManager';

export class PlatformAlertingFramework {
  private static instance: PlatformAlertingFramework | null = null;
  private serviceManager = PlatformServiceManager.getInstance();
  private alerts: Map<string, PlatformAlert> = new Map();

  private constructor() {}

  public static getInstance(): PlatformAlertingFramework {
    if (!PlatformAlertingFramework.instance) {
      PlatformAlertingFramework.instance = new PlatformAlertingFramework();
    }
    return PlatformAlertingFramework.instance;
  }

  public initialize(): void {
    // Subscribe to unified alert raising channels
    eventPlatform.subscribe('AlertRaised', (evt: any) => {
      const alert = evt.payload.alert;
      if (alert) {
        this.alerts.set(alert.id, {
          id: alert.id,
          severity: alert.severity || 'warning',
          entityId: alert.entityId,
          message: alert.message,
          timestamp: alert.timestamp || Date.now(),
          suggestedFix: alert.suggestedFix || 'Restart target service or verify parameters.',
          oneClickRepairId: alert.oneClickRepairId || alert.entityId
        });
      }
    });

    eventPlatform.subscribe('AlertResolved', (evt: any) => {
      const { alertId } = evt.payload;
      this.alerts.delete(alertId);
    });
  }

  public async triggerAlert(alert: Omit<PlatformAlert, 'timestamp'>): Promise<void> {
    const fullAlert: PlatformAlert = {
      ...alert,
      timestamp: Date.now()
    };
    this.alerts.set(fullAlert.id, fullAlert);
    
    await eventPlatform.publish({
      name: 'AlertRaised',
      source: 'alerting-framework',
      priority: alert.severity === 'critical' ? 'critical' : 'high',
      payload: { alert: fullAlert }
    });
  }

  public getActiveAlerts(): PlatformAlert[] {
    return Array.from(this.alerts.values());
  }

  public async resolveAlert(id: string): Promise<void> {
    this.alerts.delete(id);
    await eventPlatform.publish({
      name: 'AlertResolved',
      source: 'alerting-framework',
      payload: { alertId: id, timestamp: Date.now() }
    });
  }

  public async executeOneClickRepair(id: string): Promise<boolean> {
    const alert = this.alerts.get(id);
    if (!alert || !alert.oneClickRepairId) return false;

    console.log(`[AlertingFramework] Running One-Click Repair targeting "${alert.oneClickRepairId}"`);
    const success = await this.serviceManager.repairService(alert.oneClickRepairId);
    if (success) {
      await this.resolveAlert(id);
    }
    return success;
  }
}
export const platformAlertingFramework = PlatformAlertingFramework.getInstance();
export default platformAlertingFramework;
