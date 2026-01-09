import { runAgentLoop, getToolDefinitions } from "../agent/loop";

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
}

/**
 * Chat endpoint placeholder
 *
 * This will be implemented as an HTTP endpoint (Express, Fastify, etc.)
 * For now, it's a simple function that wraps the agent loop.
 */
export async function handleChatRequest(request: ChatRequest): Promise<ChatResponse> {
  const conversationId = request.conversation_id || generateConversationId();

  console.log(`[Chat API] Received request for conversation: ${conversationId}`);
  console.log(`[Chat API] Message: ${request.message}`);

  const { response } = await runAgentLoop(request.message);

  return {
    response,
    conversation_id: conversationId,
  };
}

/**
 * Get available tools endpoint
 */
export function handleGetTools() {
  return {
    tools: getToolDefinitions(),
  };
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Placeholder for future HTTP server setup
export function createChatServer(_port: number = 3000) {
  console.log("[Chat API] Server creation placeholder - implement with Express/Fastify");
  return {
    handleChatRequest,
    handleGetTools,
  };
}
