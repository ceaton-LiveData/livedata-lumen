import { registry } from "../tool-registry";
import { blockUtilSummaryTool } from "./block-util-summary";
import { blockUtilByBlockGroupTool } from "./block-util-by-block-group";
import { blockUtilBySurgeonTool } from "./block-util-by-surgeon";
import { blockUtilDrillDownTool } from "./block-util-drill-down";

// Export individual tools
export { blockUtilSummaryTool } from "./block-util-summary";
export { blockUtilByBlockGroupTool } from "./block-util-by-block-group";
export { blockUtilBySurgeonTool } from "./block-util-by-surgeon";
export { blockUtilDrillDownTool } from "./block-util-drill-down";

// Register all tools with the registry
export function registerAllTools(): void {
  registry.register(blockUtilSummaryTool);
  registry.register(blockUtilByBlockGroupTool);
  registry.register(blockUtilBySurgeonTool);
  registry.register(blockUtilDrillDownTool);
}

// All tools as an array
export const allTools = [
  blockUtilSummaryTool,
  blockUtilByBlockGroupTool,
  blockUtilBySurgeonTool,
  blockUtilDrillDownTool,
];
