// tests/unit/utils/mailer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendMail } from "../../../src/utils/mailer";
import nodemailer from "nodemailer";

describe("Mailer Utility", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should log a warning and return early if SMTP credentials are missing", async () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await sendMail({ to: "user@example.com", subject: "Test", text: "Hello" });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("SMTP credentials missing"));
  });

  it("should dispatch mail via nodemailer transport when credentials are provided", async () => {
    process.env.SMTP_USER = "test@example.com";
    process.env.SMTP_PASS = "secret123";

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: "msg-123" });
    const createTransportSpy = vi.spyOn(nodemailer, "createTransport").mockReturnValue({
      sendMail: mockSendMail,
    } as any);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await sendMail({
      to: "recipient@example.com",
      subject: "Welcome Alert",
      text: "Text body",
      html: "<b>HTML body</b>",
    });

    expect(createTransportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 587,
        auth: { user: "test@example.com", pass: "secret123" },
      })
    );
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "recipient@example.com",
        subject: "Welcome Alert",
        text: "Text body",
        html: "<b>HTML body</b>",
      })
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Successfully dispatched email"));
  });
});
