import { Message } from "@aws-sdk/client-bedrock-runtime";
import { registerAllTools } from "./mcp/tools";
import { runAgentLoop } from "./agent/loop";

// Register all tools before running
registerAllTools();

async function runTest(
  testName: string,
  question: string,
  history: Message[] = []
): Promise<Message[]> {
  console.log("\n" + "=".repeat(70));
  console.log(`TEST: ${testName}`);
  console.log("=".repeat(70));
  console.log(`\nUser: ${question}\n`);

  const toolCalls: Array<{ name: string; params: unknown; result: unknown }> = [];

  try {
    const { response, history: newHistory } = await runAgentLoop(
      question,
      history,
      {
        onToolCall: (name, params, result) => {
          toolCalls.push({ name, params, result });
          console.log(`  [Tool Call] ${name}`);
          console.log(`    Params: ${JSON.stringify(params)}`);
          console.log(`    Result: ${JSON.stringify(result, null, 2).split("\n").slice(0, 10).join("\n")}...`);
        },
      }
    );

    console.log("\n" + "-".repeat(70));
    console.log("FINAL RESPONSE:");
    console.log("-".repeat(70));
    console.log(response);

    if (toolCalls.length > 0) {
      console.log("\n" + "-".repeat(70));
      console.log(`TOOL CALLS SUMMARY (${toolCalls.length} total):`);
      console.log("-".repeat(70));
      toolCalls.forEach((call, i) => {
        console.log(`  ${i + 1}. ${call.name}(${JSON.stringify(call.params)})`);
      });
    }

    return newHistory;
  } catch (error) {
    console.error("Error:", error);
    return history;
  }
}

async function main() {
  console.log("=".repeat(70));
  console.log("AGENT LOOP TEST - Block Utilization Analytics");
  console.log("=".repeat(70));
  console.log("\nThis test sends questions to Claude via Bedrock and lets it");
  console.log("use the block utilization tools to answer them.\n");

  // Test 1: Overall utilization
  let history = await runTest(
    "Overall Block Utilization",
    "What's our overall block utilization for January 2024?"
  );

  // Test 2: Lowest utilization surgeons
  history = await runTest(
    "Lowest Utilization Surgeons",
    "Which surgeons have the lowest utilization?",
    history
  );

  // Test 3: Drill down for specific surgeon
  await runTest(
    "Surgeon Drill Down",
    "Show me the daily breakdown for Dr. Martinez for the week of January 8-12, 2024",
    history
  );

  console.log("\n" + "=".repeat(70));
  console.log("ALL TESTS COMPLETED");
  console.log("=".repeat(70));
}

main().catch(console.error);
