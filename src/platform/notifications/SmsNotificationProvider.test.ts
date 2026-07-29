import { describe, it, expect } from 'vitest';
import { SmsNotificationProvider } from './SmsNotificationProvider';

describe('SmsNotificationProvider', () => {
  const provider = SmsNotificationProvider.getInstance();

  it('should validate E.164 phone numbers correctly', () => {
    expect(provider.isValidE164PhoneNumber('+12025550123')).toBe(true);
    expect(provider.isValidE164PhoneNumber('+447911123456')).toBe(true);
    expect(provider.isValidE164PhoneNumber('12025550123')).toBe(false); // missing '+'
    expect(provider.isValidE164PhoneNumber('invalid-phone')).toBe(false);
  });

  it('should reject invalid phone numbers on sendSms', async () => {
    const res = await provider.sendSms({
      toPhoneNumber: '555-1234',
      message: 'Test message',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid phone number format');
  });

  it('should return error when Twilio credentials are not configured', async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    const res = await provider.sendSms({
      toPhoneNumber: '+12025550123',
      message: 'Test alert',
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Twilio API credentials');
  });

  it('should successfully dispatch valid SMS messages when configured', async () => {
    (provider as any).twilioAccountSid = 'ACmock123';
    (provider as any).twilioAuthToken = 'mocktoken123';

    // Mock fetch for Twilio API
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response(JSON.stringify({ sid: 'SM123' }), { status: 200 })) as any;

    try {
      const res = await provider.sendSms({
        toPhoneNumber: '+12025550123',
        message: 'Critical AegisOS Security Alert',
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toContain('sms-');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
