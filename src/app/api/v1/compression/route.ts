import { NextRequest, NextResponse } from "next/server";
import { ponytailCompressor, ChatMessage } from "@/infrastructure/sdk/platform-sdk";
import { headroomCompressor } from "@/infrastructure/sdk/platform-sdk";

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await request.json();
    const { prompt, messages, options } = body;

    if (!prompt && (!messages || !Array.isArray(messages))) {
      return NextResponse.json(
        { error: "Missing required parameter: prompt or messages list" },
        { status: 400 }
      );
    }

    let processedPrompt = prompt || "";
    let processedMessages: ChatMessage[] = [];
    let originalLength = 0;
    let compressedLength = 0;

    // 1. ponytail: Prune and summarize history messages first
    if (messages && Array.isArray(messages)) {
      const originalHistoryLen = JSON.stringify(messages).length;
      processedMessages = ponytailCompressor.summarizeHistory(messages, options?.keepLastN ?? 3);
      const compressedHistoryLen = JSON.stringify(processedMessages).length;
      
      originalLength += originalHistoryLen;
      compressedLength += compressedHistoryLen;
    }

    // 2. Headroom: Compress the prompt instruction details
    let headroomResult = { compressed: "", ratio: 1.0, originalSize: 0, compressedSize: 0 };
    if (prompt) {
      headroomResult = headroomCompressor.compressPrompt(prompt);
      processedPrompt = headroomResult.compressed;
      
      originalLength += headroomResult.originalSize;
      compressedLength += headroomResult.compressedSize;
    }

    const latencyMs = Date.now() - startTime;
    const compressionRatio = originalLength > 0 ? parseFloat((compressedLength / originalLength).toFixed(2)) : 1.0;
    
    // Simulate token size reduction and VRAM/TTFT savings
    // Assumes roughly 4 characters = 1 token.
    const originalTokens = Math.round(originalLength / 4);
    const compressedTokens = Math.round(compressedLength / 4);
    const tokensSaved = Math.max(0, originalTokens - compressedTokens);
    
    // VRAM usage: ~0.5MB saved per 1000 tokens of context compression on Gemma models.
    const vramSavedBytes = tokensSaved * 512; 
    
    // TTFT: ~200ms saved per 1000 input tokens compressed on RTX 5080.
    const ttftSavedMs = Math.round((tokensSaved / 1000) * 200);

    return NextResponse.json({
      originalLength,
      compressedLength,
      ratio: compressionRatio,
      compressedPrompt: processedPrompt,
      compressedMessages: processedMessages,
      metrics: {
        latencyMs: Math.max(1, latencyMs),
        originalTokens,
        compressedTokens,
        tokensSaved,
        vramSavedBytes,
        ttftSavedMs
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
