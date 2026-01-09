import { Tool, DateRangeParams, BlockUtilByBlockGroupResult } from "../types";

export interface BlockUtilByBlockGroupParams extends DateRangeParams {
  location?: string;
}

export const blockUtilByBlockGroupTool: Tool<
  BlockUtilByBlockGroupParams,
  BlockUtilByBlockGroupResult[]
> = {
  definition: {
    name: "block_util_by_block_group",
    description:
      "Breaks down utilization by block group (could be service line, surgeon group, or hybrid). Use this to compare utilization across different surgical services or block ownership groups.",
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
        location: {
          type: "string",
          description: "Optional filter by location (e.g., 'Main OR', 'Ambulatory')",
        },
      },
      required: ["start_date", "end_date"],
    },
  },

  execute: async (
    params: BlockUtilByBlockGroupParams
  ): Promise<BlockUtilByBlockGroupResult[]> => {
    console.log(`[block_util_by_block_group] Executing with params:`, params);

    // Stubbed realistic perioperative data by service line
    return [
      {
        blockgroup: "Orthopedics",
        blocks: 52,
        utilized_blocks: 47,
        utilization_rate: 0.9,
        cases: 118,
      },
      {
        blockgroup: "General Surgery",
        blocks: 48,
        utilized_blocks: 38,
        utilization_rate: 0.79,
        cases: 95,
      },
      {
        blockgroup: "Cardiac Surgery",
        blocks: 36,
        utilized_blocks: 31,
        utilization_rate: 0.86,
        cases: 62,
      },
      {
        blockgroup: "Neurosurgery",
        blocks: 32,
        utilized_blocks: 24,
        utilization_rate: 0.75,
        cases: 48,
      },
      {
        blockgroup: "Urology",
        blocks: 28,
        utilized_blocks: 19,
        utilization_rate: 0.68,
        cases: 42,
      },
      {
        blockgroup: "ENT",
        blocks: 24,
        utilized_blocks: 14,
        utilization_rate: 0.58,
        cases: 35,
      },
      {
        blockgroup: "Plastics",
        blocks: 16,
        utilized_blocks: 9,
        utilization_rate: 0.56,
        cases: 18,
      },
      {
        blockgroup: "Vascular",
        blocks: 12,
        utilized_blocks: 8,
        utilization_rate: 0.67,
        cases: 16,
      },
    ];
  },
};
