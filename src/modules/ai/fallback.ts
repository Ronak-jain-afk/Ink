import type { AIProvider } from "./provider";

export function createFallbackProvider(providers: AIProvider[]): AIProvider {
  let currentIndex = 0;

  return {
    get name() { return providers[currentIndex]?.name ?? "none"; },

    async chat(messages, options) {
      const errors: Error[] = [];
      for (let i = currentIndex; i < providers.length; i++) {
        try {
          const result = await providers[i]!.chat(messages, options);
          currentIndex = i;
          return result;
        } catch (e) {
          errors.push(e as Error);
        }
      }
      throw new Error(`All providers failed: ${errors.map(e => e.message).join("; ")}`);
    },

    async listModels() {
      return providers[currentIndex]?.listModels() ?? [];
    },

    async validate() {
      for (const p of providers) {
        if (await p.validate()) return true;
      }
      return false;
    },
  };
}
