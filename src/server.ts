import express, { Request, Response } from "express";
import path from "path";
import { initializeMCPClient } from "./mcp/client";
import { runAgentLoop } from "./agent/loop";
import {
  logUsage,
  getUsageStats,
  getDailyCosts,
  getDashboardUsage,
  getRecentLogs,
  getRecentErrors,
  calculateCost,
} from "./services/usage-tracker";

const app = express();
app.use(express.json());

// CORS middleware - handles preflight and adds headers
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

interface ChatRequest {
  message: string;
  dashboard?: string;
}

interface ToolCallLog {
  name: string;
  params: unknown;
  result: unknown;
}

app.post("/chat", async (req: Request, res: Response) => {
  const { message, dashboard } = req.body as ChatRequest;
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Missing or invalid 'message' field" });
    return;
  }

  const toolCalls: ToolCallLog[] = [];

  try {
    const result = await runAgentLoop(message, [], {
      dashboardId: dashboard,
      onToolCall: (name, params, result) => {
        toolCalls.push({ name, params, result });
      },
    });

    // Calculate cost
    const estimatedCost = calculateCost(result.usage.inputTokens, result.usage.outputTokens);

    // Log to usage tracker
    logUsage({
      requestId,
      timestamp,
      dashboard: result.dashboard,
      messageLength: message.length,
      toolCallCount: toolCalls.length,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      totalTokens: result.usage.totalTokens,
      iterations: result.iterations,
      durationMs: result.durationMs,
      status: "success",
    });

    // Also log to console for CloudWatch
    console.log(JSON.stringify({
      type: "request",
      requestId,
      timestamp,
      dashboard: result.dashboard,
      messageLength: message.length,
      toolCallCount: toolCalls.length,
      usage: result.usage,
      estimatedCost,
      iterations: result.iterations,
      durationMs: result.durationMs,
    }));

    res.json({
      response: result.response,
      toolCalls,
      dashboard: result.dashboard,
      availableTools: result.availableTools,
      usage: {
        ...result.usage,
        estimatedCost,
      },
      meta: {
        requestId,
        timestamp,
        iterations: result.iterations,
        durationMs: result.durationMs,
      },
    });
  } catch (error) {
    // Log error to usage tracker
    logUsage({
      requestId,
      timestamp,
      dashboard,
      messageLength: message.length,
      toolCallCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      iterations: 0,
      durationMs: 0,
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    console.error(JSON.stringify({
      type: "error",
      requestId,
      timestamp,
      dashboard,
      error: error instanceof Error ? error.message : "Unknown error",
    }));
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
      requestId,
    });
  }
});

// ==================== Admin API Endpoints ====================

app.get("/admin/stats", (_req: Request, res: Response) => {
  const stats = getUsageStats();
  res.json(stats);
});

app.get("/admin/daily-costs", (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const costs = getDailyCosts(days);
  res.json(costs);
});

app.get("/admin/dashboard-usage", (_req: Request, res: Response) => {
  const usage = getDashboardUsage();
  res.json(usage);
});

app.get("/admin/logs", (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = getRecentLogs(limit);
  res.json(logs);
});

app.get("/admin/errors", (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const errors = getRecentErrors(limit);
  res.json(errors);
});

// ==================== Health & Static Files ====================

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Serve the UI - handle both dev (src/) and prod (dist/) paths
const uiPath = __dirname.includes("dist")
  ? path.join(__dirname, "../../ui")
  : path.join(__dirname, "../ui");

app.use(express.static(uiPath));

app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(uiPath, "index.html"));
});

app.get("/admin", (_req: Request, res: Response) => {
  res.sendFile(path.join(uiPath, "admin.html"));
});

const PORT = process.env.PORT || 3001;

async function main() {
  // Initialize MCP client (spawns MCP server as child process)
  console.log("[Server] Initializing MCP client...");
  await initializeMCPClient();
  console.log("[Server] MCP client connected");

  app.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}`);
    console.log(`[Server] POST /chat - Send messages to the agent`);
    console.log(`[Server] GET /health - Health check`);
    console.log(`[Server] GET /admin - Admin dashboard`);
  });
}

main().catch((error) => {
  console.error("[Server] Fatal error:", error);
  process.exit(1);
});
