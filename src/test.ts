import { ChatAgent } from "./chat-agent";

async function main() {
  const agent = new ChatAgent();

  console.log("Sending message to Claude Sonnet 4.5 on Bedrock...\n");

  const response = await agent.sendMessage(
    "Hello! Can you briefly explain what you are?"
  );

  console.log("Response from Claude:");
  console.log(response);
}

main().catch(console.error);
