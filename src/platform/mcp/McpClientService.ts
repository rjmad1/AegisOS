import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from '../../infrastructure/observability/structured-logger';

export interface McpServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export class McpClientService {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();

  /**
   * Connect to an MCP server using stdio transport
   */
  async connectServer(config: McpServerConfig): Promise<void> {
    if (this.clients.has(config.id)) {
      logger.warn(`MCP Server ${config.id} is already connected.`);
      return;
    }

    logger.info(`Starting MCP server ${config.name} (${config.id})...`);
    
    const baseEnv = Object.fromEntries(
      Object.entries(process.env).filter(([_, v]) => v !== undefined)
    ) as Record<string, string>;

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: { ...baseEnv, ...config.env },
    });

    const client = new Client(
      {
        name: `AegisOS-McpClient-${config.id}`,
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    try {
      await client.connect(transport);
      this.clients.set(config.id, client);
      this.transports.set(config.id, transport);
      logger.info(`Successfully connected to MCP Server: ${config.name}`);
    } catch (err: any) {
      logger.error(`Failed to connect to MCP Server ${config.name}: ${err.message}`);
      throw err;
    }
  }

  /**
   * List tools available on a specific MCP server
   */
  async listTools(serverId: string) {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`MCP Server ${serverId} is not connected.`);
    }

    return await client.listTools();
  }

  /**
   * Call a tool on a specific MCP server
   */
  async callTool(serverId: string, toolName: string, args: Record<string, unknown> = {}) {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`MCP Server ${serverId} is not connected.`);
    }

    return await client.callTool({
      name: toolName,
      arguments: args,
    });
  }

  /**
   * Returns enterprise preset MCP server configurations for M365 and Google Workspace connectors
   */
  getEnterprisePresetConfig(connectorId: "m365-sharepoint-onedrive" | "google-workspace-drive"): McpServerConfig {
    if (connectorId === "m365-sharepoint-onedrive") {
      return {
        id: "m365-sharepoint-onedrive",
        name: "Microsoft 365 SharePoint & OneDrive MCP Connector",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-microsoft-365"],
        env: {
          AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID || "",
          AZURE_TENANT_ID: process.env.AZURE_TENANT_ID || ""
        }
      };
    } else {
      return {
        id: "google-workspace-drive",
        name: "Google Workspace Drive MCP Connector",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-google-drive"],
        env: {
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
          GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || ""
        }
      };
    }
  }

  /**
   * Disconnect and clean up a specific MCP server
   */
  async disconnectServer(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    const transport = this.transports.get(serverId);

    if (client) {
      await client.close();
      this.clients.delete(serverId);
    }
    
    if (transport) {
      await transport.close();
      this.transports.delete(serverId);
    }

    logger.info(`Disconnected MCP Server: ${serverId}`);
  }

  /**
   * Disconnect all MCP servers
   */
  async disconnectAll(): Promise<void> {
    const serverIds = Array.from(this.clients.keys());
    for (const id of serverIds) {
      await this.disconnectServer(id);
    }
  }
}

export const mcpClientService = new McpClientService();
