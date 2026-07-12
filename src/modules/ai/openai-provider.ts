import type { AIProvider, ChatMessage, CompletionOptions } from "./provider";

function createAsyncIterable<T>(reader: any, decoder: TextDecoder): AsyncIterable<T> {
  let buffer = "";
  return {
    [Symbol.asyncIterator]() {
      return {
        async next(): Promise<IteratorResult<T>> {
          while (true) {
            const { done, value } = await reader.read();
            if (done) return { done: true, value: undefined as any };

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") return { done: true, value: undefined as any };

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content ?? "";
                if (content) return { done: false, value: content as T };
              } catch {
                // skip malformed chunks
              }
            }
          }
        },
      };
    },
  };
}

export function createOpenAIProvider(apiKey: string, baseUrl = "https://api.openai.com/v1"): AIProvider {
  return {
    name: "openai",
    async chat(messages: ChatMessage[], options: CompletionOptions) {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          stream: true,
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`OpenAI API error: ${resp.status} ${err}`);
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      return createAsyncIterable<string>(reader, decoder);
    },

    async listModels() {
      const resp = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!resp.ok) return ["gpt-4o", "gpt-4o-mini"];
      const data = await resp.json() as any;
      return data.data?.map((m: any) => m.id) ?? [];
    },

    async validate() {
      try {
        const resp = await fetch(`${baseUrl}/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return resp.ok;
      } catch {
        return false;
      }
    },
  };
}
