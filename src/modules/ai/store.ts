import type { AIProvider } from "./provider";
import { createOpenAIProvider } from "./openai-provider";

let currentProvider: AIProvider | null = null;

export function initProvider(apiKey?: string, baseUrl?: string): void {
  const key = apiKey ?? process.env.OPENAI_API_KEY;
  if (!key) return;
  currentProvider = createOpenAIProvider(key, baseUrl);
}

export function getProvider(): AIProvider | null {
  return currentProvider;
}
