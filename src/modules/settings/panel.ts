import { getWorkspaceState } from "../workspace/workspace-store";
import { loadSettings, saveSettings, getSettings } from "../workspace/settings";
import { getMode, setMode } from "../modes/store";
import { bus } from "../../system/events";

export interface SettingItem {
  id: string;
  label: string;
  category: string;
  type: "toggle" | "number" | "select";
  value: () => any;
  set: (val: any) => void;
  options?: string[];
}

const settingsList: SettingItem[] = [
  {
    id: "showHidden",
    label: "Show Hidden Files",
    category: "Explorer",
    type: "toggle",
    value: () => getSettings().showHidden ?? false,
    set: (v) => { const ws = getWorkspaceState(); if (ws.rootPath) saveSettings(ws.rootPath, { showHidden: v }); },
  },
  {
    id: "wordWrap",
    label: "Word Wrap",
    category: "Editor",
    type: "toggle",
    value: () => getSettings().wordWrap ?? true,
    set: (v) => { const ws = getWorkspaceState(); if (ws.rootPath) saveSettings(ws.rootPath, { wordWrap: v }); },
  },
  {
    id: "tabSize",
    label: "Tab Size",
    category: "Editor",
    type: "number",
    value: () => getSettings().tabSize ?? 4,
    set: (v) => { const ws = getWorkspaceState(); if (ws.rootPath) saveSettings(ws.rootPath, { tabSize: v }); },
  },
  {
    id: "largeFileThreshold",
    label: "Large File Threshold (KB)",
    category: "Editor",
    type: "number",
    value: () => getSettings().largeFileThreshold ?? 1024,
    set: (v) => { const ws = getWorkspaceState(); if (ws.rootPath) saveSettings(ws.rootPath, { largeFileThreshold: v }); },
  },
  {
    id: "mode",
    label: "Workspace Mode",
    category: "Workspace",
    type: "select",
    value: () => getMode(),
    set: (v) => setMode(v),
    options: ["normal", "writing", "review", "git", "ai", "presentation", "distraction-free"],
  },
];

export function getSettingsList(): SettingItem[] {
  return settingsList;
}

export function updateSetting(id: string, value: any): void {
  const item = settingsList.find(s => s.id === id);
  if (!item) return;
  item.set(value);
  bus.emit("git:status-changed", {});
}
