import fs from "fs";
import path from "path";

export interface SiteConfig {
  siteId: string;
  siteName: string;

  api: {
    baseUrl: string | null;
    authMethod: "none" | "oauth2" | "apiKey";
    credentials: {
      secretArn?: string;
      apiKeyHeader?: string;
    } | null;
    timeout: number;
  };

  llm: {
    provider: "bedrock" | "anthropic";
    region: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };

  sanitization: {
    stripCaseIds: boolean;
    allowSurgeonNames: boolean;
    allowProcedureTypes: boolean;
    redactPatientInfo: boolean;
  };

  features: {
    enabledDashboards: string[];
    allowCrossDashboard: boolean;
    maxQueriesPerSession: number;
    showCalculationExplanations: boolean;
    showToolCalls: boolean;
    conversationHistory: boolean;
    responseStreaming: boolean;
  };

  dataScope: {
    facilityIds: string[] | null;
    serviceLines: string[] | null;
    dateRangeLimitDays: number;
  };

  boundaries: {
    canAnswer: string[];
    cannotAnswer: string[];
  };
}

let cachedConfig: SiteConfig | null = null;

export function getSiteConfig(): SiteConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.join(__dirname, "site.json");

  if (!fs.existsSync(configPath)) {
    throw new Error(`Site config not found at ${configPath}`);
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    cachedConfig = JSON.parse(content) as SiteConfig;
    console.log(`[SiteConfig] Loaded config for site: ${cachedConfig.siteName}`);
    return cachedConfig;
  } catch (error) {
    throw new Error(`Failed to load site config: ${error}`);
  }
}

export function clearSiteConfigCache(): void {
  cachedConfig = null;
}

// Helper functions for common checks
export function isDashboardEnabled(dashboardId: string): boolean {
  const config = getSiteConfig();
  return config.features.enabledDashboards.includes(dashboardId);
}

export function isFeatureEnabled(feature: keyof SiteConfig["features"]): boolean {
  const config = getSiteConfig();
  return Boolean(config.features[feature]);
}

export function getBoundariesForPrompt(): string {
  const config = getSiteConfig();

  let prompt = "## What you CAN help with:\n";
  for (const item of config.boundaries.canAnswer) {
    prompt += `- ${item}\n`;
  }

  prompt += "\n## What you CANNOT help with (politely decline these):\n";
  for (const item of config.boundaries.cannotAnswer) {
    prompt += `- ${item}\n`;
  }

  return prompt;
}

export function getDataScopeForPrompt(): string {
  const config = getSiteConfig();
  const scope = config.dataScope;

  let prompt = "## Data Scope:\n";

  if (scope.facilityIds) {
    prompt += `- Limited to facilities: ${scope.facilityIds.join(", ")}\n`;
  }

  if (scope.serviceLines) {
    prompt += `- Limited to service lines: ${scope.serviceLines.join(", ")}\n`;
  }

  prompt += `- Date range limited to last ${scope.dateRangeLimitDays} days\n`;

  return prompt;
}
