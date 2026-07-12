import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ConversationMessage } from "./panel-store";

function getHistoryPath(rootPath: string): string {
  return join(rootPath, ".ink", "ai-conversations.json");
}

export function saveConversation(rootPath: string, messages: ConversationMessage[]): void {
  try {
    const dir = join(rootPath, ".ink");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(getHistoryPath(rootPath), JSON.stringify(messages, null, 2), "utf-8");
  } catch {
    // silently skip
  }
}

export function loadConversation(rootPath: string): ConversationMessage[] {
  try {
    const path = getHistoryPath(rootPath);
    if (!existsSync(path)) return [];
    return JSON.parse(readFileSync(path, "utf-8")) as ConversationMessage[];
  } catch {
    return [];
  }
}
