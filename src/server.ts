import express, { Request, Response } from "express";
import { registerAllTools } from "./mcp/tools";
import { runAgentLoop } from "./agent/loop";

// Initialize tool registry
registerAllTools();

const app = express();
app.use(express.json());

interface ChatRequest {
  message: string;
}

interface ToolCallLog {
  name: string;
  params: unknown;
  result: unknown;
}

app.post("/chat", async (req: Request, res: Response) => {
  const { message } = req.body as ChatRequest;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Missing or invalid 'message' field" });
    return;
  }

  const toolCalls: ToolCallLog[] = [];

  try {
    const { response } = await runAgentLoop(message, [], {
      onToolCall: (name, params, result) => {
        toolCalls.push({ name, params, result });
      },
    });

    res.json({ response, toolCalls });
  } catch (error) {
    console.error("[Server] Error in agent loop:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
  console.log(`[Server] POST /chat - Send messages to the agent`);
  console.log(`[Server] GET /health - Health check`);
});
