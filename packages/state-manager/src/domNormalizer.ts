import * as crypto from 'crypto';

/**
 * Normalizes dynamic DOM strings (stripping dynamic IDs, inline CSS, timestamps, auto-generated class names)
 * and produces a deterministic SHA-256 hash representing structural page layout.
 */
export function normalizeAndHashDom(rawHtml: string): { domHash: string; normalizedHtml: string } {
  if (!rawHtml) {
    const emptyHash = crypto.createHash('sha256').update('').digest('hex');
    return { domHash: emptyHash, normalizedHtml: '' };
  }

  const normalizedHtml = rawHtml
    // Remove inline scripts and styles
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove dynamic attributes (id, data-reactid, data-v-*, nonce, auto-generated classes)
    .replace(/\s+(?:id|data-reactid|data-guid|data-uid|nonce|aria-controls)="[^"]*"/gi, '')
    // Strip text node contents to focus strictly on structural DOM hierarchy
    .replace(/>([^<]+)</g, '><')
    // Collapse multiple whitespaces
    .replace(/\s+/g, ' ')
    .trim();

  const domHash = crypto.createHash('sha256').update(normalizedHtml).digest('hex');

  return { domHash, normalizedHtml };
}
