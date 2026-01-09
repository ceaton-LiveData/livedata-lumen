import { registerAllTools } from "./mcp/tools";
import { registry } from "./mcp/tool-registry";

async function main() {
  console.log("=".repeat(60));
  console.log("Testing MCP Tools");
  console.log("=".repeat(60));

  // Register all tools
  registerAllTools();
  console.log("\nRegistered tools:", registry.list());

  // Test parameters
  const dateRange = {
    start_date: "2024-01-01",
    end_date: "2024-01-31",
  };

  // Test 1: block_util_summary
  console.log("\n" + "-".repeat(60));
  console.log("1. Testing block_util_summary");
  console.log("-".repeat(60));
  const summaryResult = await registry.execute("block_util_summary", dateRange);
  console.log("Result:", JSON.stringify(summaryResult, null, 2));

  // Test 2: block_util_by_block_group
  console.log("\n" + "-".repeat(60));
  console.log("2. Testing block_util_by_block_group");
  console.log("-".repeat(60));
  const blockGroupResult = await registry.execute("block_util_by_block_group", dateRange);
  console.log("Result:", JSON.stringify(blockGroupResult, null, 2));

  // Test 3: block_util_by_surgeon
  console.log("\n" + "-".repeat(60));
  console.log("3. Testing block_util_by_surgeon");
  console.log("-".repeat(60));
  const surgeonResult = await registry.execute("block_util_by_surgeon", dateRange);
  console.log("Result:", JSON.stringify(surgeonResult, null, 2));

  // Test 4: block_util_by_surgeon with filter
  console.log("\n" + "-".repeat(60));
  console.log("4. Testing block_util_by_surgeon (filtered by Orthopedics)");
  console.log("-".repeat(60));
  const filteredSurgeonResult = await registry.execute("block_util_by_surgeon", {
    ...dateRange,
    blockgroup: "Orthopedics",
  });
  console.log("Result:", JSON.stringify(filteredSurgeonResult, null, 2));

  // Test 5: block_util_drill_down (short date range)
  console.log("\n" + "-".repeat(60));
  console.log("5. Testing block_util_drill_down (1 week)");
  console.log("-".repeat(60));
  const drillDownResult = await registry.execute("block_util_drill_down", {
    start_date: "2024-01-08",
    end_date: "2024-01-12",
    surgeon: "Dr. Sarah Chen",
  });
  console.log("Result:", JSON.stringify(drillDownResult, null, 2));

  // Print tool definitions
  console.log("\n" + "=".repeat(60));
  console.log("Tool Definitions (for LLM)");
  console.log("=".repeat(60));
  const definitions = registry.getDefinitions();
  definitions.forEach((def) => {
    console.log(`\n${def.name}:`);
    console.log(`  Description: ${def.description}`);
    console.log(`  Parameters: ${JSON.stringify(def.parameters, null, 4)}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("All tests completed!");
  console.log("=".repeat(60));
}

main().catch(console.error);
