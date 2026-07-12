import type { ChatMessage } from "./provider";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

let conversation: ConversationMessage[] = [];
let isStreaming = false;

export function addUserMessage(content: string): void {
  conversation.push({ role: "user", content });
}

export function addAssistantMessage(content: string): void {
  conversation.push({ role: "assistant", content });
}

export function appendToLastMessage(content: string): void {
  const last = conversation[conversation.length - 1];
  if (last && last.role === "assistant") {
    last.content += content;
  }
}

export function clearConversation(): void {
  conversation = [];
}

export function getConversation(): ConversationMessage[] {
  return conversation;
}

export function getContextMessages(): ChatMessage[] {
  return conversation.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
}

export function setStreaming(s: boolean): void { isStreaming = s; }
export function getStreaming(): boolean { return isStreaming; }
