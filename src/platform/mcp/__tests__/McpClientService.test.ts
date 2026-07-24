import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpClientService } from '../McpClientService';
import { OAuthCredentialProvider } from '../OAuthCredentialProvider';
import { JitConsentInterceptor } from '../../governance/JitConsentInterceptor';
import { ToolSandboxProvider } from '../ToolSandboxProvider';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

vi.mock('@modelcontextprotocol/sdk/client/index.js');
vi.mock('@modelcontextprotocol/sdk/client/stdio.js');

describe('McpClientService & Action Security Extension Suite', () => {
  let mcpService: McpClientService;

  beforeEach(() => {
    mcpService = new McpClientService();
    vi.clearAllMocks();
  });

  describe('Core MCP Connection & Execution', () => {
    it('should connect to an MCP server using sandboxed stdio transport', async () => {
      const mockConnect = vi.fn().mockResolvedValue(undefined);
      (Client as any).mockImplementation(function() {
        return {
          connect: mockConnect,
          close: vi.fn(),
        };
      });

      await mcpService.connectServer({
        id: 'test-server',
        name: 'Test Server',
        command: 'node',
        args: ['test.js'],
      });

      expect(StdioClientTransport).toHaveBeenCalledWith(expect.objectContaining({
        command: 'node',
        args: ['test.js'],
      }));
      expect(Client).toHaveBeenCalled();
      expect(mockConnect).toHaveBeenCalled();
    });

    it('should list tools from a connected server', async () => {
      const mockListTools = vi.fn().mockResolvedValue({ tools: [{ name: 'test-tool' }] });
      (Client as any).mockImplementation(function() {
        return {
          connect: vi.fn().mockResolvedValue(undefined),
          listTools: mockListTools,
        };
      });

      await mcpService.connectServer({
        id: 'test-server',
        name: 'Test Server',
        command: 'node',
        args: ['test.js'],
      });

      const result = await mcpService.listTools('test-server');
      expect(mockListTools).toHaveBeenCalled();
      expect(result.tools[0].name).toBe('test-tool');
    });
  });

  describe('OAuthCredentialProvider (Encrypted Vault & PKCE)', () => {
    it('should encrypt and decrypt token payloads correctly using AES-256-GCM', () => {
      const provider = new OAuthCredentialProvider('test-master-key-for-aegisos-32b');
      const plaintext = 'ya29.a0AxooC8_test_oauth_access_token_12345';
      const ciphertext = provider.encrypt(plaintext);

      expect(ciphertext).not.toBe(plaintext);
      expect(ciphertext.split(':').length).toBe(3); // iv:authTag:ciphertext

      const decrypted = provider.decrypt(ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it('should generate valid PKCE code verifier and challenge pairs', () => {
      const provider = new OAuthCredentialProvider();
      const pkce = provider.generatePkcePair();

      expect(pkce.codeVerifier).toBeTruthy();
      expect(pkce.codeChallenge).toBeTruthy();
      expect(pkce.codeVerifier.length).toBeGreaterThan(30);
    });
  });

  describe('JitConsentInterceptor (Step-up Authorization)', () => {
    it('should identify protected write tools requiring dynamic consent', () => {
      const interceptor = new JitConsentInterceptor();
      const context = { userId: 'user-1', agentId: 'agent-1', roles: ['Operator'], permissions: [] };

      expect(interceptor.requiresConsent('send_email', {}, context)).toBe(true);
      expect(interceptor.requiresConsent('delete_file', {}, context)).toBe(true);
      expect(interceptor.requiresConsent('get_system_status', {}, context)).toBe(false);
    });

    it('should pause execution and resolve when user approves JIT consent request', async () => {
      const interceptor = new JitConsentInterceptor();
      const context = { userId: 'user-1', agentId: 'agent-1', roles: ['Operator'], permissions: [] };

      interceptor.on('consent_required', (request) => {
        // Simulate immediate user approval via Console Portal
        setTimeout(() => {
          interceptor.resolveConsentRequest(request.id, {
            approved: true,
            authorizedByUserId: 'user-1',
          });
        }, 10);
      });

      const result = await interceptor.interceptAndRequestConsent('server-1', 'send_email', {}, context);
      expect(result.approved).toBe(true);
      expect(result.authorizedByUserId).toBe('user-1');
    });
  });

  describe('Zero-Trust Secret Stripping', () => {
    it('should strip sensitive bearer tokens and API keys from raw tool outputs', async () => {
      const mockCallTool = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Result contains secret Bearer ya29.a0AxooC8_secret_token and ghp_123456789012345678901234567890123456' }]
      });

      (Client as any).mockImplementation(function() {
        return {
          connect: vi.fn().mockResolvedValue(undefined),
          callTool: mockCallTool,
        };
      });

      await mcpService.connectServer({
        id: 'test-server',
        name: 'Test Server',
        command: 'node',
        args: ['test.js'],
      });

      const result = await mcpService.callTool('test-server', 'read_logs', {});
      expect(result.secretsStrippedCount).toBeGreaterThan(0);
      expect(result.content[0].text).not.toContain('ya29.a0AxooC8_secret_token');
      expect(result.content[0].text).toContain('[REDACTED_CREDENTIAL]');
    });
  });

  describe('ToolSandboxProvider (Process & Container Isolation)', () => {
    it('should filter sensitive process.env keys when sanitizing environment', () => {
      const sandbox = new ToolSandboxProvider();
      const sanitized = sandbox.sanitizeEnvironment({ CUSTOM_VAR: 'custom_val' });

      expect(sanitized.CUSTOM_VAR).toBe('custom_val');
      expect(sanitized.DATABASE_URL).toBeUndefined(); // Privileged env vars excluded
    });
  });
});
