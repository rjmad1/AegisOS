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

  it('should successfully dispatch valid SMS messages', async () => {
    const res = await provider.sendSms({
      toPhoneNumber: '+12025550123',
      message: 'Critical AegisOS Security Alert',
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toContain('sms-');
  });
});
