import { Tool, BlockFilterParams, BlockUtilSummaryResult } from "../types";

export const blockUtilSummaryTool: Tool<BlockFilterParams, BlockUtilSummaryResult> = {
  definition: {
    name: "block_util_summary",
    description:
      "Returns overall block utilization summary for a date range. Block utilization = (actual OR time used) / (allocated block time). This is the PRIMARY metric for measuring how efficiently allocated OR block time is being used.",
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
    console.log(`[block_util_summary] Executing with params:`, params);

    // Mock data - numbers are internally consistent
    // 248 blocks × 480 min (8hr blocks) = 119,040 total allocated minutes
    // 85,795 minutes used = 72% utilization
    // Prime time (7am-3pm) utilization is typically higher
    const totalBlocks = 248;
    const utilizedBlocks = 179; // blocks where at least one case was performed
    const utilizationRate = 0.72; // 72% of allocated time actually used
    const primeTimeUtilization = 0.78; // higher during prime hours
    const totalCases = 412;

    return {
      total_blocks: totalBlocks,
      utilized_blocks: utilizedBlocks,
      utilization_rate: utilizationRate,
      prime_time_utilization: primeTimeUtilization,
      total_cases: totalCases,
      avg_cases_per_block: Math.round((totalCases / utilizedBlocks) * 10) / 10,
    };
  },
};
