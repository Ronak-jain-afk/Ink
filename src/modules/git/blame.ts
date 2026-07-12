import { execSync } from "node:child_process";

export interface BlameEntry {
  commit: string;
  author: string;
  date: string;
  line: number;
  content: string;
}

export function getBlame(rootPath: string, filePath: string): BlameEntry[] {
  const out = execSync(`git blame --line-porcelain "${filePath}"`, { cwd: rootPath, encoding: "utf-8" });
  return parseBlame(out);
}

function parseBlame(output: string): BlameEntry[] {
  const lines = output.split("\n");
  const entries: BlameEntry[] = [];
  let current: Partial<BlameEntry> = {};
  let inHeader = false;

  for (const line of lines) {
    if (!line.trim()) continue;

    // Start of a new entry: commit hash + line info
    if (/^[a-f0-9]{40}/.test(line) && !line.includes(" ")) {
      if (current.commit) {
        entries.push(current as BlameEntry);
      }
      const parts = line.split(" ");
      current = { commit: parts[0]!, line: parseInt(parts[1] ?? "0") };
      inHeader = true;
      continue;
    }

    if (inHeader) {
      if (line.startsWith("author ")) current.author = line.slice(7);
      else if (line.startsWith("author-time ")) {
        current.date = new Date(parseInt(line.slice(11)) * 1000).toISOString().slice(0, 10);
      }
      else if (line.startsWith("\t")) {
        current.content = line.slice(1);
        inHeader = false;
      }
    }
  }

  if (current.commit) entries.push(current as BlameEntry);
  return entries;
}
