import { readdir, stat } from "node:fs/promises";
import { join, relative, basename } from "node:path";
import { bus } from "../../system/events";

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  expanded?: boolean;
}

interface WorkspaceState {
  rootPath: string | null;
  tree: FileNode | null;
  showHidden: boolean;
}

const state: WorkspaceState = {
  rootPath: null,
  tree: null,
  showHidden: false,
};

async function buildTree(dirPath: string, showHidden: boolean): Promise<FileNode> {
  const name = basename(dirPath);
  const entries = await readdir(dirPath, { withFileTypes: true });

  const children: FileNode[] = [];
  for (const entry of entries) {
    if (!showHidden && entry.name.startsWith(".")) continue;
    if (entry.name === "node_modules") continue;

    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      children.push(await buildTree(fullPath, showHidden));
    } else {
      children.push({ name: entry.name, path: fullPath, isDirectory: false });
    }
  }

  children.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { name, path: dirPath, isDirectory: true, children, expanded: true };
}

export async function openWorkspace(folderPath: string): Promise<void> {
  state.rootPath = folderPath;
  state.tree = await buildTree(folderPath, state.showHidden);
  bus.emit("workspace:opened", { rootPath: folderPath });
}

export function getWorkspaceState(): WorkspaceState {
  return state;
}

export function getRelativePath(absPath: string): string {
  if (!state.rootPath) return absPath;
  return relative(state.rootPath, absPath);
}
