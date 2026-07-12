import { existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

export interface GitState {
  isRepo: boolean;
  branch: string | null;
  ahead: number;
  behind: number;
  dirty: boolean;
}

let cached: GitState = { isRepo: false, branch: null, ahead: 0, behind: 0, dirty: false };

export function detectGit(rootPath: string): GitState {
  try {
    const gitDir = join(rootPath, ".git");
    if (!existsSync(gitDir)) {
      cached = { isRepo: false, branch: null, ahead: 0, behind: 0, dirty: false };
      return cached;
    }

    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: rootPath, encoding: "utf-8" }).trim() || null;

    const status = execSync("git status --porcelain", { cwd: rootPath, encoding: "utf-8" });
    const dirty = status.trim().length > 0;

    const aheadBehind = execSync("git rev-list --count --left-right HEAD...@{upstream}", {
      cwd: rootPath,
      encoding: "utf-8",
    }).trim();
    const [a, b] = aheadBehind ? aheadBehind.split("\t").map(Number) : [0, 0];

    cached = { isRepo: true, branch, ahead: a ?? 0, behind: b ?? 0, dirty };
    return cached;
  } catch {
    cached = { isRepo: false, branch: null, ahead: 0, behind: 0, dirty: false };
    return cached;
  }
}

export function getGitState(): GitState {
  return cached;
}
