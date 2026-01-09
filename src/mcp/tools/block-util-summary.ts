import { Tool, BlockFilterParams, BlockUtilSummaryResult } from "../types";

export const blockUtilSummaryTool: Tool<BlockFilterParams, BlockUtilSummaryResult> = {
  definition: {
    name: "block_util_summary",
    description:
      "Returns overall block utilization metrics for the filtered date range. Use this to get a high-level view of OR block utilization including total blocks, utilized blocks, utilization rate, and case counts.",
    parameters: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Start date in YYYY-MM-DD format",
        },
        end_date: {
          type: "string",
          description: "End date in YYYY-MM-DD format",
        },
        blockgroup: {
          type: "string",
          description: "Optional filter by block group (e.g., 'Orthopedics', 'Cardiac')",
        },
        location: {
          type: "string",
          description: "Optional filter by location (e.g., 'Main OR', 'Ambulatory')",
        },
      },
      required: ["start_date", "end_date"],
    },
  },

  execute: async (params: BlockFilterParams): Promise<BlockUtilSummaryResult> => {
    // Stubbed realistic perioperative data
    console.log(`[block_util_summary] Executing with params:`, params);

    // Simulate some variation based on filters
    const baseUtilization = params.blockgroup ? 0.78 : 0.72;
    const locationModifier = params.location === "Main OR" ? 0.05 : 0;

    return {
      total_blocks: 248,
      utilized_blocks: 186,
      utilization_rate: Math.round((baseUtilization + locationModifier) * 100) / 100,
      prime_time_utilization: 0.81,
      total_cases: 412,
      avg_cases_per_block: 2.2,
    };
  },
};
