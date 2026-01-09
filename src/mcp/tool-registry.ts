import { Tool, ToolDefinition } from "./types";

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register<TParams, TResult>(tool: Tool<TParams, TResult>): void {
    this.tools.set(tool.definition.name, tool as Tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getDefinitions(): ToolDefinition[] {
    return this.getAll().map((tool) => tool.definition);
  }

  async execute(name: string, params: unknown): Promise<unknown> {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.execute(params);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  list(): string[] {
    return Array.from(this.tools.keys());
  }
}

export const registry = new ToolRegistry();
