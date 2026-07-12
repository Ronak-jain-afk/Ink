import { sendMessage } from "./workspace";

export interface SlashCommand {
  name: string;
  description: string;
  buildPrompt(args: string, activeFileContent: string): string;
}

const commands = new Map<string, SlashCommand>();

export function registerSlashCommand(cmd: SlashCommand): void {
  commands.set(cmd.name, cmd);
}

export function getSlashCommand(name: string): SlashCommand | undefined {
  return commands.get(name);
}

export function listSlashCommands(): SlashCommand[] {
  return Array.from(commands.values());
}

export async function executeSlashCommand(name: string, args: string, activeFileContent: string): Promise<void> {
  const cmd = commands.get(name);
  if (!cmd) return;
  const prompt = cmd.buildPrompt(args, activeFileContent);
  await sendMessage(prompt);
}

function wrap(title: string, content: string): string {
  return `${title}\n\n${content}`;
}

export function registerDefaultCommands(): void {
  registerSlashCommand({
    name: "rewrite",
    description: "Rewrite selected text with optional style/goal",
    buildPrompt: (args, content) => wrap(`Rewrite the following text. ${args ? `Style/goal: ${args}` : "Improve clarity and style."}`, content),
  });
  registerSlashCommand({
    name: "summarize",
    description: "Summarize the file or selection",
    buildPrompt: (_args, content) => wrap("Summarize the following text concisely.", content),
  });
  registerSlashCommand({
    name: "explain",
    description: "Explain the selection in plain language",
    buildPrompt: (_args, content) => wrap("Explain the following in plain, simple language.", content),
  });
  registerSlashCommand({
    name: "translate",
    description: "Translate selection to target language",
    buildPrompt: (args, content) => wrap(`Translate the following text to ${args || "English"}.`, content),
  });
  registerSlashCommand({
    name: "continue",
    description: "Propose continuation of the current document",
    buildPrompt: (_args, content) => wrap("Continue writing the following text, maintaining the same style and tone.", content),
  });
}
