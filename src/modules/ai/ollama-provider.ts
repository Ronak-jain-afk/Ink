import type { AIProvider, ChatMessage, CompletionOptions } from "./provider";

async function* streamOllama(resp: Response): AsyncGenerator<string> {
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
      if (!t) continue;
      try {
        const parsed = JSON.parse(t);
        const content = parsed.message?.content ?? parsed.response ?? "";
        if (content) yield content;
      } catch { /* skip */ }
    }
  }
}

export function createOllamaProvider(baseUrl = "http://127.0.0.1:11434"): AIProvider {
  return {
    name: "ollama",
    async chat(messages: ChatMessage[], options: CompletionOptions) {
      const resp = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: options.model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Ollama API error: ${resp.status} ${err}`);
      }

      return streamOllama(resp);
    },

    async listModels() {
      try {
        const resp = await fetch(`${baseUrl}/api/tags`);
        if (!resp.ok) return ["llama3", "mistral"];
        const data = await resp.json() as any;
        return data.models?.map((m: any) => m.name) ?? ["llama3", "mistral"];
      } catch {
        return ["llama3", "mistral"];
      }
    },

    async validate() {
      try {
        const resp = await fetch(`${baseUrl}/api/tags`);
        return resp.ok;
      } catch {
        return false;
      }
    },
  };
}
