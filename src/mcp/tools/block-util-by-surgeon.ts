import { Tool, BlockFilterParams, BlockUtilBySurgeonResult } from "../types";

export const blockUtilBySurgeonTool: Tool<BlockFilterParams, BlockUtilBySurgeonResult[]> = {
  definition: {
    name: "block_util_by_surgeon",
    description:
      "Shows utilization metrics per surgeon. Use this to analyze individual surgeon block usage, including their utilization rate, case counts, and average case duration.",
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

  execute: async (params: BlockFilterParams): Promise<BlockUtilBySurgeonResult[]> => {
    console.log(`[block_util_by_surgeon] Executing with params:`, params);

    // Stubbed realistic perioperative data by surgeon
    const allSurgeons: BlockUtilBySurgeonResult[] = [
      {
        surgeon_name: "Dr. Sarah Chen",
        blocks: 12,
        utilized_blocks: 11,
        utilization_rate: 0.92,
        cases: 28,
        avg_case_duration: 145,
      },
      {
        surgeon_name: "Dr. Michael Roberts",
        blocks: 10,
        utilized_blocks: 9,
        utilization_rate: 0.9,
        cases: 24,
        avg_case_duration: 120,
      },
      {
        surgeon_name: "Dr. James Wilson",
        blocks: 8,
        utilized_blocks: 7,
        utilization_rate: 0.88,
        cases: 18,
        avg_case_duration: 180,
      },
      {
        surgeon_name: "Dr. Emily Park",
        blocks: 8,
        utilized_blocks: 6,
        utilization_rate: 0.75,
        cases: 15,
        avg_case_duration: 95,
      },
      {
        surgeon_name: "Dr. David Martinez",
        blocks: 6,
        utilized_blocks: 5,
        utilization_rate: 0.83,
        cases: 14,
        avg_case_duration: 110,
      },
      {
        surgeon_name: "Dr. Lisa Thompson",
        blocks: 6,
        utilized_blocks: 4,
        utilization_rate: 0.67,
        cases: 10,
        avg_case_duration: 135,
      },
      {
        surgeon_name: "Dr. Robert Kim",
        blocks: 4,
        utilized_blocks: 2,
        utilization_rate: 0.5,
        cases: 6,
        avg_case_duration: 160,
      },
      {
        surgeon_name: "Dr. Jennifer Lee",
        blocks: 4,
        utilized_blocks: 3,
        utilization_rate: 0.75,
        cases: 8,
        avg_case_duration: 88,
      },
    ];

    // Filter by blockgroup if provided (simulated)
    if (params.blockgroup) {
      // Return subset based on blockgroup filter
      const blockgroupMap: Record<string, string[]> = {
        Orthopedics: ["Dr. Sarah Chen", "Dr. Michael Roberts"],
        "General Surgery": ["Dr. James Wilson", "Dr. Emily Park"],
        "Cardiac Surgery": ["Dr. David Martinez", "Dr. Lisa Thompson"],
        Neurosurgery: ["Dr. Robert Kim", "Dr. Jennifer Lee"],
      };
      const surgeonNames = blockgroupMap[params.blockgroup] || [];
      return allSurgeons.filter((s) => surgeonNames.includes(s.surgeon_name));
    }

    return allSurgeons;
  },
};
