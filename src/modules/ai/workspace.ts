import { getProvider } from "./store";
import { addUserMessage, addAssistantMessage, appendToLastMessage, setStreaming, getContextMessages } from "./panel-store";
import { bus } from "../../system/events";

export async function sendMessage(content: string): Promise<void> {
  const provider = getProvider();
  if (!provider) return;

  addUserMessage(content);
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
