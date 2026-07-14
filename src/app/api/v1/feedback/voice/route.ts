// src/app/api/v1/feedback/voice/route.ts
// Accepts multipart/form-data audio uploads, saves to disk, logs database ticket, and dispatches email.

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import prisma from "@/infrastructure/db/prisma";
import { sendMail } from "@/utils/mailer";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const audioFile = formData.get("audio") as Blob | null;
    const reportType = (formData.get("reportType") as string) || "GENERAL";
    const userEmail = (formData.get("userEmail") as string) || "anonymous@aegis-os.local";
    const appVersion = (formData.get("appVersion") as string) || "1.0.0";
    const devicePlatform = (formData.get("devicePlatform") as string) || "web";

    if (!audioFile) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "Audio file is required" },
        { status: 400 }
      );
    }

    // Generate unique Ticket ID & Timestamp
    const ticketId = `TKT-${crypto.randomInt(100000, 999999)}`;
    const timestamp = new Date();

    // Resolve target uploads directory
    const stateDir = process.env.AEGISOS_STATE_DIR || "D:\\AI-Operations";
    const feedbackUploadsDir = path.join(stateDir, "uploads", "feedback");

    // Ensure directory exists
    await fs.mkdir(feedbackUploadsDir, { recursive: true });

    // Read audio buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save audio file to local storage (named via ticket ID)
    const fileExtension = audioFile.type.split("/")[1] || "wav";
    const fileName = `${ticketId}.${fileExtension}`;
    const filePath = path.join(feedbackUploadsDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Write ticket to DB
    const ticket = await prisma.feedbackTicket.create({
      data: {
        id: ticketId,
        timestamp,
        reportType,
        userEmail,
        appVersion,
        devicePlatform,
        audioLocation: filePath,
      },
    });

    // Formulate notification email
    const consoleUrl = process.env.CONSOLE_PUBLIC_URL || "https://localhost:8443";
    const downloadLink = `${consoleUrl}/api/v1/feedback/voice/download?ticketId=${ticketId}`;
    
    const emailSubject = `[AegisOS Alert] New ${reportType} Voice Feedback Ticket: ${ticketId}`;
    const emailText = `
A new voice feedback ticket has been submitted.

Ticket ID: ${ticketId}
Timestamp: ${timestamp.toISOString()}
Report Type: ${reportType}
User Email: ${userEmail}
Application Version: ${appVersion}
Device Platform: ${devicePlatform}

Download / Listen to Audio: ${downloadLink}
    `.trim();

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
        <h2 style="color: #6200ea;">AegisOS Voice Feedback Submitted</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Ticket ID</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${ticketId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Timestamp</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${timestamp.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Report Type</td>
            <td style="padding: 8px; border: 1px solid #ddd;"><span style="background: #eee; padding: 2px 6px; border-radius: 4px;">${reportType}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">User Email</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">App Version</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${appVersion}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Device/Platform</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${devicePlatform}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">
          <a href="${downloadLink}" style="background: #6200ea; color: #white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; color: white;">Listen to Audio Recording</a>
        </p>
      </div>
    `;

    let emailSent = false;
    try {
      await sendMail({
        to: "rjkumar.pm@gmail.com",
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });
      emailSent = true;
    } catch (mailErr: any) {
      console.error(`[Feedback API] Failed to send email alert for ticket ${ticketId}:`, mailErr.message);
    }

    if (emailSent) {
      await prisma.feedbackTicket.update({
        where: { id: ticketId },
        data: { emailNotificationSent: true },
      });
    }

    return NextResponse.json({
      success: true,
      ticketId,
      timestamp,
      emailNotificationSent: emailSent,
    }, { status: 201 });

  } catch (error: any) {
    console.error("[Voice Feedback API Error]", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
