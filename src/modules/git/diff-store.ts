import { getFileDiff, renderDiff, type DiffResult } from "./diff-viewer";
import { getActiveTab } from "../workspace/store";
import { getWorkspaceState } from "../workspace/workspace-store";

let currentDiff: DiffResult | null = null;

export function showActiveFileDiff(): void {
  const tab = getActiveTab();
  const ws = getWorkspaceState();
  if (!tab || !ws.rootPath) return;
  currentDiff = getFileDiff(ws.rootPath, tab.filePath);
}

export function getCurrentDiff(): string | null {
  if (!currentDiff) return null;
  return renderDiff(currentDiff);
}

export function getCurrentDiffRaw(): DiffResult | null {
  return currentDiff;
}
