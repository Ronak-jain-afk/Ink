import type { AIProvider, ChatMessage, CompletionOptions } from "./provider";

async function* streamAnthropic(resp: Response): AsyncGenerator<string> {
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t || !t.startsWith("data: ")) continue;
      const data = t.slice(6);
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.type === "content_block_delta" ? parsed.delta?.text ?? "" : "";
        if (content) yield content;
      } catch { /* skip */ }
    }
  }
}

export function createAnthropicProvider(apiKey: string): AIProvider {
  return {
    name: "anthropic",
    async chat(messages: ChatMessage[], options: CompletionOptions) {
      const system = messages.filter(m => m.role === "system").map(m => m.content).join("\n");
      const nonSystem = messages.filter(m => m.role !== "system");

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: options.model,
          system: system || undefined,
          messages: nonSystem.map(m => ({ role: m.role, content: m.content })),
          max_tokens: options.maxTokens ?? 2048,
          stream: true,
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Anthropic API error: ${resp.status} ${err}`);
      }

      return streamAnthropic(resp);
    },

    async listModels() {
      return ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"];
    },

    async validate() {
      return apiKey.length > 0;
    },
  };
}
