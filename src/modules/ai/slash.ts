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

export function convertToTable(text: string): string {
  return textToTable(text);
}

// ponytail: table conversion uses simple heuristic (split by columns);
// proper Markdown table generation is deferred
function textToTable(content: string): string {
  const rows = content.trim().split("\n").map(r => r.split(/\s{2,}/).map(c => c.trim()).filter(Boolean));
  if (rows.length === 0 || rows[0]!.length === 0) return content;
  const cols = Math.max(...rows.map(r => r.length));
  const header = rows[0]!;
  const sep = header.map(() => "---");
  const body = rows.slice(1).map(r => {
    const filled = [...r];
    while (filled.length < cols) filled.push("");
    return filled;
  });
  return [header, sep, ...body].map(r => `| ${r.join(" | ")} |`).join("\n");
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
  registerSlashCommand({
    name: "table",
    description: "Convert loose text to Markdown table",
    buildPrompt: (args, content) => wrap(`Convert the following text into a Markdown table format. ${args ? args : `Columns: ${content.split("\n")[0]}`}`, content),
  });
  registerSlashCommand({
    name: "diagram",
    description: "Generate Mermaid diagram from description",
    buildPrompt: (args, content) => `Create a Mermaid diagram for: ${args || content || "a simple flowchart showing a decision process"}`,
  });
  registerSlashCommand({
    name: "commit",
    description: "Propose commit message from staged changes",
    buildPrompt: (_args, content) => wrap("Based on the following Git diff, write a concise commit message (subject + body):", content),
  });
  registerSlashCommand({
    name: "review",
    description: "Review document with actionable feedback",
    buildPrompt: (_args, content) => wrap("Review the following document. Provide actionable feedback on structure, clarity, and completeness:", content),
  });
  registerSlashCommand({
    name: "todo",
    description: "Scan for TODO markers and action items",
    buildPrompt: (_args, content) => wrap("Scan the following text for TODO markers, action items, and unresolved questions. List them:", content),
  });
}
