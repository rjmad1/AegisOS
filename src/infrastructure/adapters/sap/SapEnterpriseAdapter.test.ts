import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SapEnterpriseAdapter } from './SapEnterpriseAdapter';

describe('SapEnterpriseAdapter', () => {
  const config = {
    baseUrl: 'https://sap.example.com/sap/opu/odata/sap/API_BUSINESS_PARTNER/',
    authType: 'basic' as const,
    username: 'SAP_USER',
    password: 'SAP_PASSWORD',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize correctly with config', () => {
    const adapter = new SapEnterpriseAdapter(config);
    expect(adapter).toBeDefined();
  });

  it('should handle successful entity queries via mock fetch', async () => {
    const adapter = new SapEnterpriseAdapter(config);

    const mockResponse = {
      d: {
        results: [
          { BusinessPartner: '100001', CustomerName: 'Acme Corp' },
          { BusinessPartner: '100002', CustomerName: 'Globex Corp' },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'x-csrf-token': 'mock-token-xyz' }),
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    } as Response);

    const res = await adapter.queryEntitySet('A_BusinessPartner', { top: 2 });

    expect(res.success).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(res.data).toHaveLength(2);
    expect(res.data?.[0]).toEqual({ BusinessPartner: '100001', CustomerName: 'Acme Corp' });
  });

  it('should report unhealthy status on network failure', async () => {
    const adapter = new SapEnterpriseAdapter(config);

    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const health = await adapter.checkHealth();
    expect(health.status).toBe('unhealthy');
    expect(health.message).toContain('Connection refused');
  });
});
