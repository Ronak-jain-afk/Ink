import { execSync } from "node:child_process";

export type GitFileStatus = "modified" | "added" | "deleted" | "renamed" | "untracked";

const statusMap: Record<string, GitFileStatus> = {
  M: "modified",
  A: "added",
  D: "deleted",
  R: "renamed",
  "?": "untracked",
};

export function getFileStatuses(rootPath: string): Map<string, GitFileStatus> {
  const map = new Map<string, GitFileStatus>();

  try {
    // Tracked files
    const tracked = execSync("git status --porcelain", { cwd: rootPath, encoding: "utf-8" });
    for (const line of tracked.split("\n").filter(Boolean)) {
      const xy = line.slice(0, 2);
      const path = line.slice(3).trim();
      const status = statusMap[xy[0]!] ?? statusMap[xy[1]!];
      if (status) map.set(path, status);
    }
  } catch {
    // not a repo
  }

  return map;
}

export function statusGlyph(status: GitFileStatus): string {
  switch (status) {
    case "modified": return "~";
    case "added": return "+";
    case "deleted": return "-";
    case "renamed": return "→";
    case "untracked": return "?";
  }
}
