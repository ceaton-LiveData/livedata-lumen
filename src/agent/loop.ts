import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message,
  ContentBlock,
  ToolConfiguration,
  StopReason,
} from "@aws-sdk/client-bedrock-runtime";
import { getMCPClient, MCPTool } from "../mcp/client";
import { buildSystemPrompt } from "./prompts";

const MODEL_ID = "us.anthropic.claude-sonnet-4-5-20250929-v1:0";

export interface AgentLoopOptions {
  maxIterations?: number;
  region?: string;
  dashboardId?: string;
  onToolCall?: (name: string, params: unknown, result: unknown) => void;
  onResponse?: (response: string) => void;
}

export interface AgentLoopResult {
  response: string;
  history: Message[];
  dashboard?: string;
  availableTools: string[];
}

function convertToBedrockToolConfig(tools: MCPTool[]): ToolConfiguration {
  const toolSpecs = tools.map((tool) => ({
    toolSpec: {
      name: tool.name,
      description: tool.description,
      inputSchema: {
        json: JSON.parse(JSON.stringify(tool.inputSchema)),
      },
    },
  }));

  return { tools: toolSpecs } as ToolConfiguration;
}

function extractTextFromContent(content: ContentBlock[] | undefined): string {
  if (!content) return "";

  const textBlocks = content.filter(
    (block): block is ContentBlock.TextMember => "text" in block
  );

  return textBlocks.map((block) => block.text).join("\n");
}

interface ToolUseBlock {
  toolUseId: string;
  name: string;
  input: Record<string, unknown>;
}

function extractToolUseFromContent(
  content: ContentBlock[] | undefined
): ToolUseBlock[] {
  if (!content) return [];

  const toolUseBlocks: ToolUseBlock[] = [];

  for (const block of content) {
    if ("toolUse" in block && block.toolUse) {
      toolUseBlocks.push({
        toolUseId: block.toolUse.toolUseId!,
        name: block.toolUse.name!,
        input: block.toolUse.input as Record<string, unknown>,
      });
    }
  }

  return toolUseBlocks;
}

export async function runAgentLoop(
  userMessage: string,
  conversationHistory: Message[] = [],
  options: AgentLoopOptions = {}
): Promise<AgentLoopResult> {
  const { maxIterations = 10, region = "us-east-1", dashboardId, onToolCall, onResponse } = options;

  const bedrockClient = new BedrockRuntimeClient({ region });
  const mcpClient = getMCPClient();

  // Get tool definitions from MCP server (filtered by dashboard if provided)
  const mcpTools = dashboardId
    ? await mcpClient.listToolsForDashboard(dashboardId)
    : await mcpClient.listTools();
  const toolConfig = convertToBedrockToolConfig(mcpTools);
  const systemPrompt = buildSystemPrompt();
  const availableToolNames = mcpTools.map((t) => t.name);

  // Add the user message to history
  const messages: Message[] = [
    ...conversationHistory,
    {
      role: "user",
      content: [{ text: userMessage }],
    },
  ];

  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    const command = new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: systemPrompt }],
      messages,
      toolConfig,
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0.7,
      },
    });

    const response = await bedrockClient.send(command);
    const stopReason = response.stopReason as StopReason;
    const assistantMessage = response.output?.message;

    if (!assistantMessage) {
      throw new Error("No response from model");
    }

    // Add assistant's response to history
    messages.push(assistantMessage);

    // If the model stopped with end_turn or max_tokens, return the text response
    if (stopReason === "end_turn" || stopReason === "max_tokens") {
      const finalText = extractTextFromContent(assistantMessage.content);
      if (onResponse) {
        onResponse(finalText);
      }
      return {
        response: finalText,
        history: messages,
        dashboard: dashboardId,
        availableTools: availableToolNames,
      };
    }

    // If the model wants to use tools
    if (stopReason === "tool_use") {
      const toolUseBlocks = extractToolUseFromContent(assistantMessage.content);

      if (toolUseBlocks.length === 0) {
        throw new Error("Model indicated tool_use but no tool calls found");
      }

      // Execute all tool calls via MCP client and collect results
      const toolResultContents: ContentBlock[] = [];

      for (const toolUse of toolUseBlocks) {
        let result: unknown;
        let isError = false;

        try {
          // Call tool via MCP client
          const mcpResult = await mcpClient.callTool(toolUse.name, toolUse.input);
          isError = mcpResult.isError || false;

          // Parse the JSON result from MCP response
          const textContent = mcpResult.content.find((c) => c.type === "text");
          if (textContent) {
            try {
              result = JSON.parse(textContent.text);
            } catch {
              // If not valid JSON, use raw text
              result = { text: textContent.text };
            }
          } else {
            result = { error: "No content in tool response" };
            isError = true;
          }

          if (onToolCall) {
            onToolCall(toolUse.name, toolUse.input, result);
          }
        } catch (error) {
          isError = true;
          result = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }

        // Build the tool result content block
        // Bedrock requires json to be an object, not an array - wrap arrays in { data: [...] }
        const jsonResult = Array.isArray(result)
          ? { data: result }
          : (result as Record<string, unknown>);

        const toolResultBlock = {
          toolResult: {
            toolUseId: toolUse.toolUseId,
            content: [{ json: jsonResult }],
            status: isError ? "error" : "success",
          },
        };
        toolResultContents.push(toolResultBlock as ContentBlock);
      }

      // Add tool results as a user message
      messages.push({
        role: "user",
        content: toolResultContents,
      });
    }
  }

  throw new Error(`Max iterations (${maxIterations}) exceeded`);
}

export async function getToolDefinitions(): Promise<MCPTool[]> {
  const mcpClient = getMCPClient();
  return mcpClient.listTools();
}
