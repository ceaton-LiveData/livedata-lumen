import { Tool, BlockUtilDrillDownParams, BlockUtilDrillDownResult } from "../types";

export const blockUtilDrillDownTool: Tool<
  BlockUtilDrillDownParams,
  BlockUtilDrillDownResult[]
> = {
  definition: {
    name: "block_util_drill_down",
    description:
      "Detailed case-level data for a specific block or surgeon. Use this to get granular day-by-day block utilization details including scheduled vs completed cases, in-block time, and out-of-block time.",
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
        surgeon: {
          type: "string",
          description: "Optional filter by surgeon name",
        },
        blockgroup: {
          type: "string",
          description: "Optional filter by block group",
        },
      },
      required: ["start_date", "end_date"],
    },
  },

  execute: async (
    params: BlockUtilDrillDownParams
  ): Promise<BlockUtilDrillDownResult[]> => {
    console.log(`[block_util_drill_down] Executing with params:`, params);

    // Generate stubbed realistic daily block data
    const startDate = new Date(params.start_date);
    const endDate = new Date(params.end_date);
    const results: BlockUtilDrillDownResult[] = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Skip weekends
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const casesScheduled = Math.floor(Math.random() * 3) + 2; // 2-4 cases
        const casesCompleted = Math.min(
          casesScheduled,
          casesScheduled - Math.floor(Math.random() * 2)
        ); // 0-1 cancellations
        const utilizationRate = 0.6 + Math.random() * 0.35; // 60-95%
        const inBlockTime = Math.floor(360 + Math.random() * 120); // 360-480 minutes (6-8 hours)
        const outOfBlockTime = Math.floor(Math.random() * 60); // 0-60 minutes overtime

        results.push({
          date: currentDate.toISOString().split("T")[0],
          block_start: "07:30",
          block_end: "15:30",
          cases_scheduled: casesScheduled,
          cases_completed: casesCompleted,
          utilization_rate: Math.round(utilizationRate * 100) / 100,
          in_block_time: inBlockTime,
          out_of_block_time: outOfBlockTime,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return results;
  },
};
