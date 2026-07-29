import { describe, it, expect } from 'vitest';
import { DocumentProcessor } from './DocumentProcessor';

describe('DocumentProcessor', () => {
  it('should process text document and generate chunks correctly', async () => {
    const processor = new DocumentProcessor();
    const content = 'AegisOS is an enterprise AI Operating System built for multi-agent execution and intent management. '.repeat(20);

    const doc = await processor.processDocument('doc-101', 'overview.md', content, {
      chunkSizeTokens: 100,
    });

    expect(doc.documentId).toBe('doc-101');
    expect(doc.fileName).toBe('overview.md');
    expect(doc.mimeType).toBe('text/markdown');
    expect(doc.totalChunks).toBeGreaterThan(0);
    expect(doc.chunks[0].content).toContain('AegisOS');
  });

  it('should process images with OCR extraction', async () => {
    const processor = new DocumentProcessor();
    const imageBuffer = Buffer.from('fake-image-data');

    const doc = await processor.processDocument('doc-102', 'invoice.png', imageBuffer, {
      performOcr: true,
    });

    expect(doc.ocrResult).toBeDefined();
    expect(doc.ocrResult?.confidence).toBeGreaterThan(0.8);
    expect(doc.extractedMetadata.hasOcr).toBe(true);
  });
});
