import { execSync } from "node:child_process";

export function stageFile(rootPath: string, filePath: string): void {
  execSync(`git add "${filePath}"`, { cwd: rootPath, encoding: "utf-8" });
}

export function unstageFile(rootPath: string, filePath: string): void {
  execSync(`git restore --staged "${filePath}"`, { cwd: rootPath, encoding: "utf-8" });
}

export function stageAll(rootPath: string): void {
  execSync("git add -A", { cwd: rootPath, encoding: "utf-8" });
}

export function unstageAll(rootPath: string): void {
  execSync("git reset", { cwd: rootPath, encoding: "utf-8" });
}

export function getStagedFiles(rootPath: string): string[] {
  const out = execSync("git diff --cached --name-only", { cwd: rootPath, encoding: "utf-8" });
  return out.trim().split("\n").filter(Boolean);
}
