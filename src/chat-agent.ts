import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message,
  ContentBlock,
} from "@aws-sdk/client-bedrock-runtime";

const MODEL_ID = "us.anthropic.claude-sonnet-4-5-20250929-v1:0";

export class ChatAgent {
  private client: BedrockRuntimeClient;
  private conversationHistory: Message[] = [];

  constructor(region: string = "us-east-1") {
    this.client = new BedrockRuntimeClient({ region });
  }

  async sendMessage(userMessage: string): Promise<string> {
    const userContent: ContentBlock[] = [{ text: userMessage }];
    this.conversationHistory.push({
      role: "user",
      content: userContent,
    });

    const command = new ConverseCommand({
      modelId: MODEL_ID,
      messages: this.conversationHistory,
      inferenceConfig: {
        maxTokens: 1024,
        temperature: 0.7,
      },
    });

    const response = await this.client.send(command);

    const assistantMessage = response.output?.message;
    if (assistantMessage) {
      this.conversationHistory.push(assistantMessage);
    }

    const textContent = assistantMessage?.content?.find(
      (block): block is ContentBlock.TextMember => "text" in block
    );

    return textContent?.text ?? "No response received";
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}
