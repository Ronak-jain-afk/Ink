import type { FileNode } from "./workspace-store";

export interface MultiRootState {
  roots: string[];
  trees: FileNode[];
}

const state: MultiRootState = {
  roots: [],
  trees: [],
};

export function addRoot(rootPath: string, tree: FileNode): void {
  state.roots.push(rootPath);
  state.trees.push(tree);
}

export function removeRoot(rootPath: string): void {
  const idx = state.roots.indexOf(rootPath);
  if (idx !== -1) {
    state.roots.splice(idx, 1);
    state.trees.splice(idx, 1);
  }
}

export function clearRoots(): void {
  state.roots = [];
  state.trees = [];
}

export function getMultiRoots(): MultiRootState {
  return state;
}
