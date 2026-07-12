import { readdir, stat } from "node:fs/promises";
import { join, relative, basename } from "node:path";
import { bus } from "../../system/events";
import { loadSettings } from "./settings";
import { addRoot, removeRoot, clearRoots } from "./multiroot";
import { loadThemeForWorkspace } from "../themes/store";
import { detectGit } from "../git/detect";
import { getFileStatuses, type GitFileStatus } from "../git/status-badges";

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
  fileStatuses: Map<string, GitFileStatus>;
}

const state: WorkspaceState = {
  rootPath: null,
  tree: null,
  showHidden: false,
  fileStatuses: new Map(),
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

export async function openWorkspace(folderPath: string, append = false): Promise<void> {
  loadThemeForWorkspace(folderPath);
  detectGit(folderPath);
  state.fileStatuses = getFileStatuses(folderPath);
  bus.emit("git:status-changed", {});
  const settings = loadSettings(folderPath);
  const showHidden = settings.showHidden ?? false;
  const tree = await buildTree(folderPath, showHidden);

  if (!append || !state.rootPath) {
    clearRoots();
    state.rootPath = folderPath;
    state.showHidden = showHidden;
    state.tree = tree;
  } else {
    addRoot(folderPath, tree);
  }

  bus.emit("workspace:opened", { rootPath: folderPath });
}

export function getWorkspaceState(): WorkspaceState {
  return state;
}

export function getRelativePath(absPath: string): string {
  if (!state.rootPath) return absPath;
  return relative(state.rootPath, absPath);
}

// ponytail: shared editor text for export/selection actions
let currentEditorText = "";
export function setEditorText(t: string): void { currentEditorText = t; }
export function getEditorText(): string { return currentEditorText; }

export function getAllFiles(): { path: string; name: string }[] {
  const result: { path: string; name: string }[] = [];
  function walk(node: FileNode): void {
    if (!node.isDirectory) result.push({ path: node.path, name: node.name });
    for (const child of node.children ?? []) walk(child);
  }
  if (state.tree) walk(state.tree);
  return result;
}
