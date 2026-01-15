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
      "Breaks down block utilization by service line/block group. Use this to compare how different surgical services are using their allocated block time.",
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

    // Mock data - realistic service line utilization
    // Total: 248 blocks, 412 cases (matches summary tool)
    return [
      {
        blockgroup: "Orthopedics",
        blocks: 52,
        utilized_blocks: 48,
        utilization_rate: 0.82,
        cases: 108,
      },
      {
        blockgroup: "General Surgery",
        blocks: 48,
        utilized_blocks: 42,
        utilization_rate: 0.74,
        cases: 89,
      },
      {
        blockgroup: "Cardiac Surgery",
        blocks: 36,
        utilized_blocks: 32,
        utilization_rate: 0.79,
        cases: 58,
      },
      {
        blockgroup: "Neurosurgery",
        blocks: 32,
        utilized_blocks: 26,
        utilization_rate: 0.71,
        cases: 45,
      },
      {
        blockgroup: "Urology",
        blocks: 28,
        utilized_blocks: 22,
        utilization_rate: 0.68,
        cases: 48,
      },
      {
        blockgroup: "ENT",
        blocks: 24,
        utilized_blocks: 18,
        utilization_rate: 0.62,
        cases: 38,
      },
      {
        blockgroup: "Plastics",
        blocks: 16,
        utilized_blocks: 11,
        utilization_rate: 0.58,
        cases: 16,
      },
      {
        blockgroup: "Vascular",
        blocks: 12,
        utilized_blocks: 9,
        utilization_rate: 0.65,
        cases: 10,
      },
    ];
  },
};
