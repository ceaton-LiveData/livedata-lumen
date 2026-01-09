import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChildProcess, spawn } from "child_process";
import path from "path";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private serverProcess: ChildProcess | null = null;
  private connected = false;

  constructor() {
    this.client = new Client(
      {
        name: "lumen-agent",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    // Spawn the MCP server as a child process
    const serverPath = path.join(__dirname, "server.ts");

    this.transport = new StdioClientTransport({
      command: "npx",
      args: ["ts-node", serverPath],
    });

    await this.client.connect(this.transport);
    this.connected = true;
    console.log("[MCP Client] Connected to MCP server");
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    await this.client.close();
    this.connected = false;
    console.log("[MCP Client] Disconnected from MCP server");
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.connected) {
      throw new Error("MCP client not connected");
    }

    const response = await this.client.listTools();

    return response.tools.map((tool) => ({
      name: tool.name,
      description: tool.description || "",
      inputSchema: tool.inputSchema as Record<string, unknown>,
    }));
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    if (!this.connected) {
      throw new Error("MCP client not connected");
    }

    const response = await this.client.callTool({
      name,
      arguments: args,
    });

    return {
      content: response.content as Array<{ type: string; text: string }>,
      isError: response.isError as boolean | undefined,
    };
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
let mcpClientInstance: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
  }
  return mcpClientInstance;
}

export async function initializeMCPClient(): Promise<MCPClient> {
  const client = getMCPClient();
  await client.connect();
  return client;
}
