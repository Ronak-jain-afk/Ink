import { execSync } from "node:child_process";

export function fetch(rootPath: string): string {
  return execSync("git fetch --all", { cwd: rootPath, encoding: "utf-8" });
}

export function pull(rootPath: string): string {
  return execSync("git pull", { cwd: rootPath, encoding: "utf-8" });
}

export function push(rootPath: string): string {
  return execSync("git push", { cwd: rootPath, encoding: "utf-8" });
}

export function merge(rootPath: string, branch: string): string {
  return execSync(`git merge "${branch}"`, { cwd: rootPath, encoding: "utf-8" });
}

export function rebase(rootPath: string, branch: string): string {
  return execSync(`git rebase "${branch}"`, { cwd: rootPath, encoding: "utf-8" });
}
