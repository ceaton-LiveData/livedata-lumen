import fs from "fs";
import path from "path";

export interface DashboardManifest {
  id: string;
  name: string;
  description: string;
  availableTools: string[];
  outOfScope: string[];
  suggestedQuestions: string[];
}

const dashboardCache = new Map<string, DashboardManifest>();

function getDashboardsDir(): string {
  return path.join(__dirname);
}

export function getDashboardManifest(dashboardId: string): DashboardManifest | null {
  if (dashboardCache.has(dashboardId)) {
    return dashboardCache.get(dashboardId)!;
  }

  const manifestPath = path.join(getDashboardsDir(), `${dashboardId}.json`);

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(content) as DashboardManifest;
    dashboardCache.set(dashboardId, manifest);
    return manifest;
  } catch (error) {
    console.error(`[Dashboards] Error loading manifest for ${dashboardId}:`, error);
    return null;
  }
}

export function listDashboards(): DashboardManifest[] {
  const dashboardsDir = getDashboardsDir();
  const dashboards: DashboardManifest[] = [];

  try {
    const files = fs.readdirSync(dashboardsDir);

    for (const file of files) {
      if (file.endsWith(".json")) {
        const dashboardId = file.replace(".json", "");
        const manifest = getDashboardManifest(dashboardId);
        if (manifest) {
          dashboards.push(manifest);
        }
      }
    }
  } catch (error) {
    console.error("[Dashboards] Error listing dashboards:", error);
  }

  return dashboards;
}

export function clearDashboardCache(): void {
  dashboardCache.clear();
}
