// src/utils/mailer.ts
// Secure SMTP email relay using nodemailer

import nodemailer from "nodemailer";

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an email using SMTP transport settings defined in environment variables.
 */
export async function sendMail(options: MailOptions): Promise<void> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || "system-alerts@aegis-os.local";

  if (!user || !pass) {
    console.warn("[Mailer] SMTP credentials missing. Please set SMTP_USER and SMTP_PASS in settings. Email skipped.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      // Do not fail on invalid certificates (useful for self-hosted local LAN SMTP relays)
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`[Mailer] Successfully dispatched email notification to ${options.to}`);
  } catch (err: any) {
    console.error("[Mailer] Failed to send email alert:", err.message);
    throw err;
  }
}
