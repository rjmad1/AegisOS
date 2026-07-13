import fs from 'fs/promises';
import path from 'path';

const AUDIT_FILE_PATH = path.join(process.cwd(), 'databases', 'event_audit.json');

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: 'Login Success' | 'Login Failure' | 'Unauthorized Access' | 'Session Created' | 'Session Expired' | 'Security Violation';
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  details: string;
}

export class AuditService {
  private async ensureFile(): Promise<void> {
    try {
      await fs.access(AUDIT_FILE_PATH);
    } catch {
      await fs.writeFile(AUDIT_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    await this.ensureFile();
    const data = await fs.readFile(AUDIT_FILE_PATH, 'utf-8');
    const events: AuditEvent[] = JSON.parse(data);
    
    events.push({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event
    });

    await fs.writeFile(AUDIT_FILE_PATH, JSON.stringify(events, null, 2), 'utf-8');
  }
}

export const auditService = new AuditService();
