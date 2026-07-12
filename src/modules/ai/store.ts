import type { AIProvider } from "./provider";
import { createOpenAIProvider } from "./openai-provider";
import { createAnthropicProvider } from "./anthropic-provider";
import { createOllamaProvider } from "./ollama-provider";
import { createFallbackProvider } from "./fallback";

let currentProvider: AIProvider | null = null;
let providerType: "openai" | "anthropic" | "ollama" | "fallback" = "openai";

export function initProvider(apiKey?: string, baseUrl?: string): void {
  const key = apiKey ?? process.env.OPENAI_API_KEY;
  if (key) {
    currentProvider = createOpenAIProvider(key, baseUrl);
    providerType = "openai";
  }
}

export function switchProvider(type: "openai" | "anthropic" | "ollama" | "fallback", apiKey?: string, baseUrl?: string): void {
  providerType = type;
  switch (type) {
    case "openai":
      currentProvider = createOpenAIProvider(apiKey ?? process.env.OPENAI_API_KEY ?? "", baseUrl);
      break;
    case "anthropic":
      currentProvider = createAnthropicProvider(apiKey ?? process.env.ANTHROPIC_API_KEY ?? "");
      break;
    case "ollama":
      currentProvider = createOllamaProvider(baseUrl);
      break;
    case "fallback": {
      const providers: AIProvider[] = [];
      if (apiKey) providers.push(createOpenAIProvider(apiKey, baseUrl));
      if (process.env.ANTHROPIC_API_KEY) providers.push(createAnthropicProvider(process.env.ANTHROPIC_API_KEY));
      providers.push(createOllamaProvider());
      currentProvider = createFallbackProvider(providers);
      break;
    }
  }
}

export function getProviderType(): string {
  return providerType;
}

export function getProvider(): AIProvider | null {
  return currentProvider;
}
