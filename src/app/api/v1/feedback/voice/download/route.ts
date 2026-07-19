// src/app/api/v1/feedback/voice/download/route.ts
// Secure endpoint to download stored voice feedback recordings

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/infrastructure/sdk/platform-sdk";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json({ error: "BAD_REQUEST", message: "ticketId parameter is required" }, { status: 400 });
    }

    const ticket = await prisma.feedbackTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Feedback ticket not found" }, { status: 404 });
    }

    const filePath = ticket.audioLocation;
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      
      const response = new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Disposition": `attachment; filename="${ticketId}.wav"`,
        }
      });
      return response;
    } catch (fileErr) {
      console.error(`[Feedback Download] Audio file missing on disk: ${filePath}`);
      return NextResponse.json({ error: "FILE_MISSING", message: "Audio file is no longer resident on host workstation" }, { status: 410 });
    }

  } catch (error: any) {
    console.error("[Voice Feedback Download API Error]", error);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 });
  }
}
