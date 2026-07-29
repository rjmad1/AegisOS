// ============================================================================
// SMS Notification Provider — Twilio & AWS SNS Integration Adapter
// ============================================================================

export interface SmsOptions {
  toPhoneNumber: string; // E.164 format e.g. "+12025550123"
  message: string;
  senderId?: string;
  provider?: "twilio" | "aws-sns";
}

export interface SmsDeliveryResult {
  success: boolean;
  messageId: string;
  phoneNumber: string;
  providerUsed: string;
  sentAt: string;
  error?: string;
}

export class SmsNotificationProvider {
  private static instance: SmsNotificationProvider | null = null;
  private twilioAccountSid: string | undefined;
  private twilioAuthToken: string | undefined;
  private twilioFromNumber: string | undefined;

  private constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioFromNumber = process.env.TWILIO_FROM_NUMBER || "+18005550199";
  }

  public static getInstance(): SmsNotificationProvider {
    if (!SmsNotificationProvider.instance) {
      SmsNotificationProvider.instance = new SmsNotificationProvider();
    }
    return SmsNotificationProvider.instance;
  }

  /**
   * Validates if a phone number conforms to standard E.164 format.
   */
  public isValidE164PhoneNumber(phone: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Sends an SMS message to an E.164 phone number via Twilio or AWS SNS fallback.
   */
  public async sendSms(options: SmsOptions): Promise<SmsDeliveryResult> {
    const { toPhoneNumber, message, provider = "twilio" } = options;

    if (!this.isValidE164PhoneNumber(toPhoneNumber)) {
      return {
        success: false,
        messageId: "",
        phoneNumber: toPhoneNumber,
        providerUsed: provider,
        sentAt: new Date().toISOString(),
        error: `Invalid phone number format '${toPhoneNumber}'. Must follow E.164 standard (e.g. +12025550123).`,
      };
    }

    console.log(`[SmsNotificationProvider] Sending SMS via ${provider} to ${toPhoneNumber}...`);

    // Execute SMS dispatch via Twilio API or simulated gateway response
    try {
      const messageId = `sms-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      if (provider === "aws-sns") {
        const awsRegion = process.env.AWS_SNS_REGION || process.env.AWS_REGION || "us-east-1";
        const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
        const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;

        if (!awsAccessKey || !awsSecretKey) {
          throw new Error("AWS SNS credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) are not configured.");
        }

        console.log(`[SmsNotificationProvider] Dispatching AWS SNS Publish to ${toPhoneNumber} in ${awsRegion}`);
        // AWS SNS REST API POST dispatch
        const snsEndpoint = `https://sns.${awsRegion}.amazonaws.com/`;
        const body = new URLSearchParams({
          Action: "Publish",
          PhoneNumber: toPhoneNumber,
          Message: message,
          Version: "2010-03-31",
        });

        const res = await fetch(snsEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`AWS SNS HTTP ${res.status}: ${errText}`);
        }
      } else {
        if (!this.twilioAccountSid || !this.twilioAuthToken) {
          throw new Error("Twilio API credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN) are not configured.");
        }

        const auth = Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString("base64");
        const body = new URLSearchParams({
          To: toPhoneNumber,
          From: this.twilioFromNumber || "",
          Body: message,
        });

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
          }
        );

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Twilio API HTTP ${res.status}: ${errText}`);
        }
      }

      return {
        success: true,
        messageId,
        phoneNumber: toPhoneNumber,
        providerUsed: provider,
        sentAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error(`[SmsNotificationProvider] Failed to dispatch SMS: ${err?.message}`);
      return {
        success: false,
        messageId: "",
        phoneNumber: toPhoneNumber,
        providerUsed: provider,
        sentAt: new Date().toISOString(),
        error: err?.message || "SMS dispatch failed",
      };
    }
  }
}

export const smsNotificationProvider = SmsNotificationProvider.getInstance();
