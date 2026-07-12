import { execSync } from "node:child_process";

export interface BranchInfo {
  name: string;
  current: boolean;
}

export function listBranches(rootPath: string): BranchInfo[] {
  const out = execSync("git branch", { cwd: rootPath, encoding: "utf-8" });
  return out.split("\n").filter(Boolean).map(line => ({
    name: line.replace("*", "").trim(),
    current: line.startsWith("*"),
  }));
}

export function createBranch(rootPath: string, name: string): void {
  execSync(`git branch "${name}"`, { cwd: rootPath, encoding: "utf-8" });
}

export function switchBranch(rootPath: string, name: string): void {
  execSync(`git checkout "${name}"`, { cwd: rootPath, encoding: "utf-8" });
}

export function renameBranch(rootPath: string, oldName: string, newName: string): void {
  execSync(`git branch -m "${oldName}" "${newName}"`, { cwd: rootPath, encoding: "utf-8" });
}

export function deleteBranch(rootPath: string, name: string): void {
  execSync(`git branch -d "${name}"`, { cwd: rootPath, encoding: "utf-8" });
}
