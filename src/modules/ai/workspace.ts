import { getProvider } from "./store";
import { addUserMessage, addAssistantMessage, appendToLastMessage, setStreaming, getContextMessages } from "./panel-store";
import { readFileContent } from "../workspace/file-system";
import { bus } from "../../system/events";

const MAX_CONTEXT_TOKENS = 8000; // ponytail: rough char-based estimate; proper token counting deferred

async function buildContext(userMessage: string, filePaths: string[] = []): Promise<string> {
  let context = "";
  let totalLen = userMessage.length;

  for (const fp of filePaths) {
    if (totalLen > MAX_CONTEXT_TOKENS * 4) break;
    try {
      const { text } = await readFileContent(fp);
      const snippet = text.slice(0, 2000);
      context += `\n--- ${fp} ---\n${snippet}\n`;
      totalLen += snippet.length;
    } catch { /* skip */ }
  }

  return context + `\n---\n${userMessage}`;
}

export async function sendMessage(content: string, filePaths: string[] = []): Promise<void> {
  const provider = getProvider();
  if (!provider) return;

  const enriched = await buildContext(content, filePaths);
  addUserMessage(enriched);
  addAssistantMessage("");
  setStreaming(true);
  bus.emit("ai:update", {});

  const messages = getContextMessages();
  try {
    const stream = await provider.chat(messages, { model: "gpt-4o" });
    for await (const chunk of stream) {
      appendToLastMessage(chunk);
      bus.emit("ai:update", {});
    }
  } catch (err) {
    appendToLastMessage(`\n[Error: ${err}]`);
  }

  setStreaming(false);
  bus.emit("ai:update", {});
}
