import { getProvider } from "./store";

let currentModel = "gpt-4o";

export function getCurrentModel(): string {
  return currentModel;
}

export async function setModel(model: string): Promise<void> {
  currentModel = model;
}

export async function listAvailableModels(): Promise<string[]> {
  const provider = getProvider();
  if (!provider) return ["gpt-4o", "gpt-4o-mini"];
  try {
    return await provider.listModels();
  } catch {
    return ["gpt-4o", "gpt-4o-mini"];
  }
}
