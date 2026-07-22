import { z } from 'zod';

export interface Envelope<T> {
  messageId: string;
  correlationId: string;
  timestamp: string; // ISO8601
  version: 'v1';
  type: string;
  payload: T;
}

export const EnvelopeSchema = <T extends z.ZodTypeAny>(payloadSchema: T) =>
  z.object({
    messageId: z.string().uuid(),
    correlationId: z.string().uuid(),
    timestamp: z.string().datetime(),
    version: z.literal('v1'),
    type: z.string().min(1),
    payload: payloadSchema,
  });

export function createEnvelope<T>(
  type: string,
  payload: T,
  correlationId: string
): Envelope<T> {
  return {
    messageId: crypto.randomUUID(),
    correlationId,
    timestamp: new Date().toISOString(),
    version: 'v1',
    type,
    payload,
  };
}
