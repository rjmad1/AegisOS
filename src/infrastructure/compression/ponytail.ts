export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class PonytailCompressor {
  private static instance: PonytailCompressor | null = null;

  private constructor() {}

  public static getInstance(): PonytailCompressor {
    if (!PonytailCompressor.instance) {
      PonytailCompressor.instance = new PonytailCompressor();
    }
    return PonytailCompressor.instance;
  }

  // Prune long redundant tool listings and repeated structures
  public pruneContent(content: string): string {
    if (!content) return "";

    let pruned = content;

    // ponytail: remove consecutive duplicate lines (common in tool loops)
    const lines = pruned.split("\n");
    const uniqueLines: string[] = [];
    let lastLine = "";
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip repeating lines
      if (trimmed !== "" && trimmed === lastLine) {
        continue;
      }
      uniqueLines.push(line);
      lastLine = trimmed;
    }
    pruned = uniqueLines.join("\n");

    // Collapsing extremely long lists of repeated values (e.g. list of ids or files)
    pruned = pruned.replace(/(\[[0-9a-zA-Z"'\s,]{3,}\],?\s*){5,}/g, "[...repeated arrays collapsed...]\n");

    return pruned;
  }

  // Summarize older history, leaving the most recent context intact
  public summarizeHistory(messages: ChatMessage[], keepLastN: number = 3): ChatMessage[] {
    if (messages.length <= keepLastN + 1) {
      return messages;
    }

    const systemMessages = messages.filter((m) => m.role === "system");
    const activeMessages = messages.filter((m) => m.role !== "system");

    if (activeMessages.length <= keepLastN) {
      return messages;
    }

    const toSummarize = activeMessages.slice(0, activeMessages.length - keepLastN);
    const toKeep = activeMessages.slice(activeMessages.length - keepLastN);

    // Simulate summarization of older dialogue (ponytail: lazy offline summary simulation)
    const summaryBullets = toSummarize
      .filter((m) => m.role === "user")
      .map((m) => `- User asked about: "${m.content.slice(0, 50).trim()}${m.content.length > 50 ? '...' : ''}"`)
      .slice(0, 5);

    const summaryContent = `[System Context Optimization Summary of earlier dialogue]:\n${summaryBullets.join("\n") || "- Earlier introductory turns."}`;

    const summaryMessage: ChatMessage = {
      role: "system",
      content: summaryContent
    };

    return [
      ...systemMessages,
      summaryMessage,
      ...toKeep.map((m) => ({ ...m, content: this.pruneContent(m.content) }))
    ];
  }
}

export const ponytailCompressor = PonytailCompressor.getInstance();
export default ponytailCompressor;
