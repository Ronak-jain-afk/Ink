export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  name: string;
  chat(messages: ChatMessage[], options: CompletionOptions): Promise<AsyncIterable<string>>;
  listModels(): Promise<string[]>;
  validate(): Promise<boolean>;
}
