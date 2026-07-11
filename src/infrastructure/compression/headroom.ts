export class HeadroomCompressor {
  private static instance: HeadroomCompressor | null = null;

  private constructor() {}

  public static getInstance(): HeadroomCompressor {
    if (!HeadroomCompressor.instance) {
      HeadroomCompressor.instance = new HeadroomCompressor();
    }
    return HeadroomCompressor.instance;
  }

  // Strips code comments (C-style, Python, HTML) from string block
  private stripComments(code: string, fileType: string = "ts"): string {
    let output = code;
    if (["ts", "js", "tsx", "jsx", "java", "go", "c", "cpp"].includes(fileType)) {
      // Remove double slash comments
      output = output.replace(/\/\/[^#\n]*\n/g, "\n");
      // Remove multi-line comments
      output = output.replace(/\/\*[\s\S]*?\*\//g, "");
    } else if (["py", "sh", "yaml", "yml"].includes(fileType)) {
      // Remove hash comments (keeping shebangs or comments with special flags if any)
      output = output.replace(/#[^!\n]*\n/g, "\n");
    } else if (["html", "xml"].includes(fileType)) {
      // Remove xml comments
      output = output.replace(/<!--[\s\S]*?-->/g, "");
    }
    return output;
  }

  // Compresses prompt blocks
  public compressPrompt(prompt: string): { compressed: string; ratio: number; originalSize: number; compressedSize: number } {
    if (!prompt) {
      return { compressed: "", ratio: 1.0, originalSize: 0, compressedSize: 0 };
    }

    const originalSize = prompt.length;
    let compressed = prompt;

    // 1. ponytail: strip long comments in embedded source code blocks
    // Matches markdown code blocks e.g. ```typescript ... ```
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    compressed = compressed.replace(codeBlockRegex, (match, lang, code) => {
      const language = lang ? lang.toLowerCase() : "ts";
      const cleanedCode = this.stripComments(code, language);
      return `\`\`\`${language}\n${cleanedCode}\`\`\``;
    });

    // 2. Collapse excessive whitespace, tabs, and duplicate empty lines
    compressed = compressed.replace(/[ \t]+/g, " "); // collapse spaces
    compressed = compressed.replace(/\n\s*\n+/g, "\n"); // collapse multiple newlines

    // 3. Condense JSON structures inside prompt (minify JSON blocks)
    const jsonBlockRegex = /\{[\s\S]*?\}/g;
    // Compress small to medium JSON blocks to single-line minified JSON
    compressed = compressed.replace(jsonBlockRegex, (match) => {
      try {
        const parsed = JSON.parse(match);
        return JSON.stringify(parsed);
      } catch {
        return match; // Not valid JSON, keep as is
      }
    });

    // 4. Compact verbose system instructions (abbreviating instructions to save tokens)
    compressed = compressed.replace(/please write/gi, "write");
    compressed = compressed.replace(/would you please/gi, "");
    compressed = compressed.replace(/in order to/gi, "to");
    compressed = compressed.replace(/as quickly as possible/gi, "quickly");

    const compressedSize = compressed.length;
    const ratio = originalSize > 0 ? parseFloat((compressedSize / originalSize).toFixed(2)) : 1.0;

    return {
      compressed,
      ratio,
      originalSize,
      compressedSize
    };
  }
}

export const headroomCompressor = HeadroomCompressor.getInstance();
export default headroomCompressor;
