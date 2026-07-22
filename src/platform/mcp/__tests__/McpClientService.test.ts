import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpClientService } from '../McpClientService';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

vi.mock('@modelcontextprotocol/sdk/client/index.js');
vi.mock('@modelcontextprotocol/sdk/client/stdio.js');

describe('McpClientService', () => {
  let mcpService: McpClientService;

  beforeEach(() => {
    mcpService = new McpClientService();
    vi.clearAllMocks();
  });

  it('should connect to an MCP server using stdio transport', async () => {
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

  it('should call a tool on a connected server', async () => {
    const mockCallTool = vi.fn().mockResolvedValue({ content: 'test-result' });
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

    const result = await mcpService.callTool('test-server', 'test-tool', { arg1: 'value1' });
    expect(mockCallTool).toHaveBeenCalledWith({
      name: 'test-tool',
      arguments: { arg1: 'value1' }
    });
    expect(result.content).toBe('test-result');
  });

  it('should return enterprise preset configs for M365 and Google Workspace connectors', () => {
    const m365Config = mcpService.getEnterprisePresetConfig('m365-sharepoint-onedrive');
    expect(m365Config.id).toBe('m365-sharepoint-onedrive');
    expect(m365Config.args).toContain('@modelcontextprotocol/server-microsoft-365');

    const googleConfig = mcpService.getEnterprisePresetConfig('google-workspace-drive');
    expect(googleConfig.id).toBe('google-workspace-drive');
    expect(googleConfig.args).toContain('@modelcontextprotocol/server-google-drive');
  });
});
