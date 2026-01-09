export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  items?: JSONSchemaProperty;
  description?: string;
}

export interface JSONSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
}

export interface Tool<TParams = unknown, TResult = unknown> {
  definition: ToolDefinition;
  execute: (params: TParams) => Promise<TResult>;
}

// Common parameter types
export interface DateRangeParams {
  start_date: string;
  end_date: string;
}

export interface BlockFilterParams extends DateRangeParams {
  blockgroup?: string;
  location?: string;
}

// Block utilization result types
export interface BlockUtilSummaryResult {
  total_blocks: number;
  utilized_blocks: number;
  utilization_rate: number;
  prime_time_utilization: number;
  total_cases: number;
  avg_cases_per_block: number;
}

export interface BlockUtilByBlockGroupResult {
  blockgroup: string;
  blocks: number;
  utilized_blocks: number;
  utilization_rate: number;
  cases: number;
}

export interface BlockUtilBySurgeonResult {
  surgeon_name: string;
  blocks: number;
  utilized_blocks: number;
  utilization_rate: number;
  cases: number;
  avg_case_duration: number;
}

export interface BlockUtilDrillDownParams extends DateRangeParams {
  surgeon?: string;
  blockgroup?: string;
}

export interface BlockUtilDrillDownResult {
  date: string;
  block_start: string;
  block_end: string;
  cases_scheduled: number;
  cases_completed: number;
  utilization_rate: number;
  in_block_time: number;
  out_of_block_time: number;
}
