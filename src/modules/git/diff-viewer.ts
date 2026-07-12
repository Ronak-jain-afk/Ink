import { execSync } from "node:child_process";

export interface DiffLine {
  type: "add" | "del" | "context";
  content: string;
  oldLine: number | null;
  newLine: number | null;
}

export interface DiffResult {
  filePath: string;
  hunks: DiffLine[];
}

export function getFileDiff(rootPath: string, filePath: string, staged = false): DiffResult {
  const cmd = staged ? `git diff --cached "${filePath}"` : `git diff "${filePath}"`;
  const raw = execSync(cmd, { cwd: rootPath, encoding: "utf-8" });
  return parseDiff(raw, filePath);
}

export function getAllDiffs(rootPath: string): DiffResult[] {
  const raw = execSync("git diff", { cwd: rootPath, encoding: "utf-8" });
  return parseUnifiedDiff(raw);
}

function parseDiff(raw: string, filePath: string): DiffResult {
  const hunks: DiffLine[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      hunks.push({ type: "add", content: line.slice(1), oldLine: null, newLine: null });
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      hunks.push({ type: "del", content: line.slice(1), oldLine: null, newLine: null });
    } else if (line.startsWith(" ")) {
      hunks.push({ type: "context", content: line.slice(1), oldLine: null, newLine: null });
    }
  }
  return { filePath, hunks };
}

function parseUnifiedDiff(raw: string): DiffResult[] {
  const results: DiffResult[] = [];
  const lines = raw.split("\n");
  let current: DiffResult | null = null;

  for (const line of lines) {
    const fileMatch = line.match(/^diff --git a\/(.+?) b\//);
    if (fileMatch) {
      if (current) results.push(current);
      current = { filePath: fileMatch[1]!, hunks: [] };
      continue;
    }
    if (!current) continue;
    if (line.startsWith("+") && !line.startsWith("+++")) {
      current.hunks.push({ type: "add", content: line.slice(1), oldLine: null, newLine: null });
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      current.hunks.push({ type: "del", content: line.slice(1), oldLine: null, newLine: null });
    } else if (line.startsWith(" ")) {
      current.hunks.push({ type: "context", content: line.slice(1), oldLine: null, newLine: null });
    }
  }

  if (current) results.push(current);
  return results;
}

const diffGlyph = { add: "+", del: "-", context: " " };
const diffColor = { add: "\x1b[32m", del: "\x1b[31m", context: "" };

export function renderDiff(diff: DiffResult): string {
  return diff.hunks.map(h => `${diffColor[h.type]}${diffGlyph[h.type]} ${h.content}\x1b[0m`).join("\n");
}
