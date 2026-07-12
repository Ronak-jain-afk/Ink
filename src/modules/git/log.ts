import { execSync } from "node:child_process";

export interface CommitEntry {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export function getLog(rootPath: string, maxCount = 50): CommitEntry[] {
  const out = execSync(
    `git log --oneline --format="%H|%an|%ai|%s" --max-count=${maxCount}`,
    { cwd: rootPath, encoding: "utf-8" },
  );
  return out.trim().split("\n").filter(Boolean).map(line => {
    const parts = line.split("|");
    return {
      hash: parts[0] ?? "",
      author: parts[1] ?? "",
      date: (parts[2] ?? "").slice(0, 10),
      message: parts.slice(3).join("|"),
    };
  });
}

export function getCommitDiff(rootPath: string, hash: string): string {
  return execSync(`git show --stat --patch "${hash}"`, { cwd: rootPath, encoding: "utf-8" });
}
