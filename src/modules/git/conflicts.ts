import { readFileSync, writeFileSync } from "node:fs";

export interface ConflictRegion {
  ours: string[];
  theirs: string[];
  ancestor: string[];
}

const CONFLICT_MARKER = /^<<<<<<< HEAD$|^=======$|^>>>>>>> .+$/;

export function detectConflicts(filePath: string): ConflictRegion[] {
  try {
    const content = readFileSync(filePath, "utf-8");
    return parseConflicts(content);
  } catch {
    return [];
  }
}

export function parseConflicts(content: string): ConflictRegion[] {
  const lines = content.split("\n");
  const regions: ConflictRegion[] = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i]?.startsWith("<<<<<<<")) {
      const ours: string[] = [];
      const theirs: string[] = [];
      i++;
      while (i < lines.length && lines[i] !== "=======") {
        ours.push(lines[i]!);
        i++;
      }
      i++; // skip =======
      while (i < lines.length && !lines[i]!.startsWith(">>>>>>>")) {
        theirs.push(lines[i]!);
        i++;
      }
      i++; // skip >>>>>>>
      regions.push({ ours, theirs, ancestor: [] });
    } else {
      i++;
    }
  }

  return regions;
}

export function resolveConflict(filePath: string, choice: "ours" | "theirs"): void {
  const content = readFileSync(filePath, "utf-8");
  const resolved = content
    .replace(/<<<<<<< HEAD\n[\s\S]*?\n=======\n[\s\S]*?\n>>>>>>> .+$/gm, (match) => {
      const lines = match.split("\n");
      const sepIdx = lines.indexOf("=======");
      if (sepIdx === -1) return match;
      return choice === "ours"
        ? lines.slice(1, sepIdx).join("\n")
        : lines.slice(sepIdx + 1, -1).join("\n");
    });
  writeFileSync(filePath, resolved, "utf-8");
}
