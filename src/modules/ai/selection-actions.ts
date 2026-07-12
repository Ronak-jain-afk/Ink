import { sendMessage } from "./workspace";

// ponytail: reads from the active editor's selection via the textarea ref
let getSelectedText: (() => string) | null = null;

export function setSelectedTextGetter(fn: () => string): void {
  getSelectedText = fn;
}

export async function rewriteSelection(style?: string): Promise<void> {
  const text = getSelectedText?.() ?? "";
  if (!text) return;
  const prompt = style
    ? `Rewrite the following text. Style: ${style}\n\n${text}`
    : `Rewrite the following text to improve clarity and style:\n\n${text}`;
  await sendMessage(prompt);
}

export async function summarizeSelection(): Promise<void> {
  const text = getSelectedText?.() ?? "";
  if (!text) return;
  await sendMessage(`Summarize the following text concisely:\n\n${text}`);
}

export async function explainSelection(): Promise<void> {
  const text = getSelectedText?.() ?? "";
  if (!text) return;
  await sendMessage(`Explain the following in plain language:\n\n${text}`);
}

export async function translateSelection(targetLang = "English"): Promise<void> {
  const text = getSelectedText?.() ?? "";
  if (!text) return;
  await sendMessage(`Translate the following text to ${targetLang}:\n\n${text}`);
}
