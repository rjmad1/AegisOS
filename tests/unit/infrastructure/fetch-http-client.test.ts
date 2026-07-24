// tests/unit/infrastructure/fetch-http-client.test.ts
// Unit tests for FetchHttpClientAdapter and HttpClientFactory

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FetchHttpClientAdapter } from '@/infrastructure/adapters/fetch-http-client';
import { HttpClientFactory } from '@/infrastructure/factories/http-client-factory';

describe('FetchHttpClientAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should instantiate via HttpClientFactory', () => {
    const client = HttpClientFactory.createClient(5000);
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(FetchHttpClientAdapter);
  });

  it('should handle successful GET requests with JSON response', async () => {
    const mockData = { id: 'test-123', name: 'Test Artifact' };
    
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockData,
    } as Response);

    const client = new FetchHttpClientAdapter();
    const response = await client.get('/api/v1/artifacts/test-123');

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.data).toEqual(mockData);
  });

  it('should append query parameters correctly', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [],
    } as Response);

    globalThis.fetch = fetchSpy;

    const client = new FetchHttpClientAdapter();
    await client.get('/api/v1/artifacts', { params: { search: 'query', limit: 10 } });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('search=query&limit=10'),
      expect.anything()
    );
  });

  it('should retry failed requests on exception', async () => {
    const fetchSpy = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      } as Response);

    globalThis.fetch = fetchSpy;

    const client = new FetchHttpClientAdapter();
    const response = await client.get('/api/v1/test', { retries: 1 });

    expect(response.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
