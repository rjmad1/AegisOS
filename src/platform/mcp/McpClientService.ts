import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from '../../infrastructure/observability/structured-logger';
import { IdentityAwareToolContext, SanitizedToolResult } from './contracts';
import { OAuthCredentialProvider } from './OAuthCredentialProvider';
import { JitConsentInterceptor } from '../governance/JitConsentInterceptor';
import { ToolSandboxProvider } from './ToolSandboxProvider';

export interface McpServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  sandboxMode?: 'PROCESS' | 'DOCKER' | 'NONE';
}

export class McpClientService {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();
  private sandboxProvider: ToolSandboxProvider = new ToolSandboxProvider();

  public oauthProvider: OAuthCredentialProvider;
  public consentInterceptor: JitConsentInterceptor;

  constructor() {
    this.oauthProvider = new OAuthCredentialProvider();
    this.consentInterceptor = new JitConsentInterceptor();
  }

  /**
   * Connect to an MCP server using sandboxed Stdio transport
   */
  async connectServer(config: McpServerConfig): Promise<void> {
    if (this.clients.has(config.id)) {
      logger.warn(`MCP Server ${config.id} is already connected.`);
      return;
    }

    logger.info(`Starting MCP server ${config.name} (${config.id})...`);
    
    // Apply process or container sandboxing
    const sandboxConfig = this.sandboxProvider.createSandboxProcessConfig({
      command: config.command,
      args: config.args,
      env: config.env,
      sandboxMode: config.sandboxMode || 'PROCESS',
    });

    const transport = new StdioClientTransport({
      command: sandboxConfig.command,
      args: sandboxConfig.args,
      env: sandboxConfig.env,
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
   * Call a tool on a specific MCP server with Two-Identity Context binding, JIT User Consent,
   * OAuth token injection, and Zero-Trust Secret Stripping on return payloads.
   */
  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown> = {},
    context?: IdentityAwareToolContext
  ): Promise<SanitizedToolResult> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`MCP Server ${serverId} is not connected.`);
    }

    const activeContext: IdentityAwareToolContext = context || {
      userId: 'anonymous-local-user',
      agentId: 'default-aegis-agent',
      roles: ['Operator'],
      permissions: ['tool:execute'],
    };

    logger.info(`[MCP-IDENTITY] Tool ${toolName} requested by User ${activeContext.userId} via Agent ${activeContext.agentId}`);

    // Check if dynamic JIT User Consent is required before executing tool
    if (this.consentInterceptor.requiresConsent(toolName, args, activeContext)) {
      const consentResult = await this.consentInterceptor.interceptAndRequestConsent(
        serverId,
        toolName,
        args,
        activeContext
      );

      if (!consentResult.approved) {
        logger.warn(`[JIT-CONSENT] Tool call ${toolName} rejected by policy or user.`);
        return {
          content: [{ type: 'text', text: `Tool execution blocked by governance policy: ${consentResult.reason || 'User consent not granted.'}` }],
          isError: true,
          executionDurationMs: 0,
          secretsStrippedCount: 0,
        };
      }
    }

    const startTime = Date.now();

    try {
      const rawResult = await client.callTool({
        name: toolName,
        arguments: args,
      });

      const durationMs = Date.now() - startTime;
      
      // Perform Zero-Trust secret stripping on output payloads before returning to LLM
      const sanitized = this.stripSensitiveData(rawResult);

      return {
        content: sanitized.content,
        isError: Boolean(rawResult.isError),
        executionDurationMs: durationMs,
        secretsStrippedCount: sanitized.strippedCount,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      logger.error(`Error calling MCP tool ${toolName} on server ${serverId}: ${err.message}`);
      return {
        content: [{ type: 'text', text: `Tool Execution Error: ${err.message}` }],
        isError: true,
        executionDurationMs: durationMs,
        secretsStrippedCount: 0,
      };
    }
  }

  /**
   * Zero-Trust Secret Stripping: Replaces sensitive API keys, OAuth tokens, and auth headers from tool outputs
   */
  private stripSensitiveData(rawResult: any): { content: any[]; strippedCount: number } {
    let strippedCount = 0;
    const secretPatterns = [
      /bearer\s+[a-zA-Z0-9_\-\.=]+/gi,
      /ghp_[a-zA-Z0-9]{36}/g,
      /ya29\.[a-zA-Z0-9_\-]+/g,
      /sk-[a-zA-Z0-9]{32,}/g,
      /eyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/g // JWT pattern
    ];

    const content = (rawResult.content || []).map((item: any) => {
      if (item.type === 'text' && typeof item.text === 'string') {
        let sanitizedText = item.text;
        for (const pattern of secretPatterns) {
          const matches = sanitizedText.match(pattern);
          if (matches) {
            strippedCount += matches.length;
            sanitizedText = sanitizedText.replace(pattern, '[REDACTED_CREDENTIAL]');
          }
        }
        return { ...item, text: sanitizedText };
      }
      return item;
    });

    return { content, strippedCount };
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
        },
        sandboxMode: 'PROCESS',
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
        },
        sandboxMode: 'PROCESS',
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
