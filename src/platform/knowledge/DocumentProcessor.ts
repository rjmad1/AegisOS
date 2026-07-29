// ============================================================================
// Document Processor — Unified Multi-Format Chunking & OCR Ingestion Engine
// ============================================================================

import { OcrEngineAdapter, OcrResult } from './OcrEngineAdapter';

export interface DocumentChunk {
  chunkIndex: number;
  content: string;
  tokenEstimate: number;
  metadata: Record<string, unknown>;
}

export interface ProcessedDocument {
  documentId: string;
  fileName: string;
  mimeType: string;
  totalChunks: number;
  chunks: DocumentChunk[];
  ocrResult?: OcrResult;
  extractedMetadata: Record<string, unknown>;
  processedAt: string;
}

export interface ProcessorOptions {
  chunkSizeTokens?: number;
  chunkOverlapTokens?: number;
  performOcr?: boolean;
  ocrLanguage?: string;
}

export class DocumentProcessor {
  private ocrAdapter: OcrEngineAdapter;

  constructor() {
    this.ocrAdapter = OcrEngineAdapter.getInstance();
  }

  /**
   * Processes an incoming document (Text, Markdown, PDF, Image) and converts it
   * into semantic chunks ready for vector indexing.
   */
  public async processDocument(
    documentId: string,
    fileName: string,
    content: string | Buffer,
    options: ProcessorOptions = {}
  ): Promise<ProcessedDocument> {
    const chunkSize = options.chunkSizeTokens || 500;
    const chunkOverlap = options.chunkOverlapTokens || 50;
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    let fullText = '';
    let ocrResult: OcrResult | undefined;

    const isImage = ['png', 'jpg', 'jpeg', 'tif', 'tiff', 'bmp', 'webp'].includes(extension);

    if (isImage || options.performOcr) {
      ocrResult = await this.ocrAdapter.processImage(content, {
        language: options.ocrLanguage || 'en',
        extractTables: true,
      });
      fullText = ocrResult.text;
    } else if (Buffer.isBuffer(content)) {
      fullText = content.toString('utf-8');
    } else {
      fullText = content;
    }

    const chunks = this.chunkText(fullText, chunkSize, chunkOverlap, {
      documentId,
      fileName,
      mimeType: this.getMimeType(extension),
    });

    return {
      documentId,
      fileName,
      mimeType: this.getMimeType(extension),
      totalChunks: chunks.length,
      chunks,
      ocrResult,
      extractedMetadata: {
        extension,
        charCount: fullText.length,
        hasOcr: Boolean(ocrResult),
      },
      processedAt: new Date().toISOString(),
    };
  }

  private chunkText(
    text: string,
    chunkSize: number,
    chunkOverlap: number,
    baseMetadata: Record<string, unknown>
  ): DocumentChunk[] {
    const words = text.split(/\s+/);
    const chunks: DocumentChunk[] = [];
    const wordsPerChunk = Math.max(10, Math.floor(chunkSize * 0.75));
    const overlapWords = Math.floor(chunkOverlap * 0.75);

    let index = 0;
    let chunkCount = 0;

    while (index < words.length) {
      const slice = words.slice(index, index + wordsPerChunk);
      const chunkText = slice.join(' ');

      chunks.push({
        chunkIndex: chunkCount,
        content: chunkText,
        tokenEstimate: Math.ceil(slice.length * 1.33),
        metadata: {
          ...baseMetadata,
          chunkIndex: chunkCount,
          startWordIndex: index,
          endWordIndex: index + slice.length,
        },
      });

      chunkCount++;
      index += wordsPerChunk - overlapWords;
    }

    return chunks;
  }

  private getMimeType(extension: string): string {
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      md: 'text/markdown',
      txt: 'text/plain',
      json: 'application/json',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    };
    return mimeMap[extension] || 'application/octet-stream';
  }
}
