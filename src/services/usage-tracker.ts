// Usage tracking service with in-memory storage
// Can be swapped for database storage later (Supabase, DynamoDB, etc.)

import { randomUUID } from "crypto";

export interface ApiUsageLog {
  id: string;
  requestId: string;
  timestamp: string;
  dashboard?: string;
  messageLength: number;
  toolCallCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  iterations: number;
  durationMs: number;
  status: "success" | "error";
  errorMessage?: string;
}

export interface UsageStats {
  totalCost: number;
  costToday: number;
  costThisWeek: number;
  costThisMonth: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  avgResponseTimeMs: number;
}

export interface DailyCost {
  date: string;
  cost: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

export interface DashboardUsage {
  dashboard: string;
  totalCalls: number;
  totalCost: number;
  totalTokens: number;
}

// Claude Sonnet 4.5 pricing (Bedrock, as of Jan 2025)
// https://aws.amazon.com/bedrock/pricing/
const MODEL_PRICING = {
  "claude-sonnet-4.5": {
    inputPerMillion: 3.0,   // $3.00 per 1M input tokens
    outputPerMillion: 15.0, // $15.00 per 1M output tokens
  },
};

export function calculateCost(inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING["claude-sonnet-4.5"];
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  return inputCost + outputCost;
}

// In-memory storage (replace with database for production)
const usageLogs: ApiUsageLog[] = [];

export function logUsage(log: Omit<ApiUsageLog, "id" | "estimatedCost">): ApiUsageLog {
  const estimatedCost = calculateCost(log.inputTokens, log.outputTokens);
  const entry: ApiUsageLog = {
    ...log,
    id: randomUUID(),
    estimatedCost,
  };
  usageLogs.push(entry);

  // Keep only last 10000 entries to prevent memory issues
  if (usageLogs.length > 10000) {
    usageLogs.shift();
  }

  return entry;
}

export function getUsageStats(): UsageStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let totalCost = 0;
  let costToday = 0;
  let costThisWeek = 0;
  let costThisMonth = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let successfulCalls = 0;
  let failedCalls = 0;
  let totalResponseTime = 0;

  for (const log of usageLogs) {
    totalCost += log.estimatedCost;
    totalInputTokens += log.inputTokens;
    totalOutputTokens += log.outputTokens;
    totalResponseTime += log.durationMs;

    if (log.status === "success") {
      successfulCalls++;
    } else {
      failedCalls++;
    }

    if (log.timestamp >= todayStart) {
      costToday += log.estimatedCost;
    }
    if (log.timestamp >= weekAgo) {
      costThisWeek += log.estimatedCost;
    }
    if (log.timestamp >= monthStart) {
      costThisMonth += log.estimatedCost;
    }
  }

  return {
    totalCost,
    costToday,
    costThisWeek,
    costThisMonth,
    totalInputTokens,
    totalOutputTokens,
    totalCalls: usageLogs.length,
    successfulCalls,
    failedCalls,
    avgResponseTimeMs: usageLogs.length > 0 ? totalResponseTime / usageLogs.length : 0,
  };
}

export function getDailyCosts(days: number = 30): DailyCost[] {
  const now = new Date();
  const dailyMap = new Map<string, DailyCost>();

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    dailyMap.set(dateStr, {
      date: dateStr,
      cost: 0,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
    });
  }

  // Aggregate logs by day
  for (const log of usageLogs) {
    const dateStr = log.timestamp.split("T")[0];
    const daily = dailyMap.get(dateStr);
    if (daily) {
      daily.cost += log.estimatedCost;
      daily.calls += 1;
      daily.inputTokens += log.inputTokens;
      daily.outputTokens += log.outputTokens;
    }
  }

  return Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export function getDashboardUsage(): DashboardUsage[] {
  const dashboardMap = new Map<string, DashboardUsage>();

  for (const log of usageLogs) {
    const dashboard = log.dashboard || "unknown";
    let usage = dashboardMap.get(dashboard);
    if (!usage) {
      usage = { dashboard, totalCalls: 0, totalCost: 0, totalTokens: 0 };
      dashboardMap.set(dashboard, usage);
    }
    usage.totalCalls += 1;
    usage.totalCost += log.estimatedCost;
    usage.totalTokens += log.totalTokens;
  }

  return Array.from(dashboardMap.values()).sort((a, b) => b.totalCost - a.totalCost);
}

export function getRecentLogs(limit: number = 100): ApiUsageLog[] {
  return usageLogs.slice(-limit).reverse();
}

export function getRecentErrors(limit: number = 50): ApiUsageLog[] {
  return usageLogs
    .filter((log) => log.status === "error")
    .slice(-limit)
    .reverse();
}
