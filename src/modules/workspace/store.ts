import { bus } from "../../system/events";

export interface Tab {
  id: string;
  filePath: string;
  fileName: string;
  dirty: boolean;
  isLarge: boolean;
}

interface WorkspaceState {
  tabs: Tab[];
  activeTabId: string | null;
}

const state: WorkspaceState = {
  tabs: [],
  activeTabId: null,
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function openTab(filePath: string): Tab {
  const existing = state.tabs.find(t => t.filePath === filePath);
  if (existing) {
    state.activeTabId = existing.id;
    bus.emit("tab:opened", { filePath });
    return existing;
  }

  const parts = filePath.split("/");
  const tab: Tab = {
    id: generateId(),
    filePath,
    fileName: parts[parts.length - 1] ?? filePath,
    dirty: false,
    isLarge: false,
  };

  state.tabs.push(tab);
  state.activeTabId = tab.id;
  bus.emit("tab:opened", { filePath });
  return tab;
}

export function closeTab(tabId: string): void {
  const idx = state.tabs.findIndex(t => t.id === tabId);
  if (idx === -1) return;

  const tab = state.tabs[idx]!;
  state.tabs.splice(idx, 1);

  if (state.activeTabId === tabId) {
    if (state.tabs.length === 0) {
      state.activeTabId = null;
    } else {
      state.activeTabId = state.tabs[Math.min(idx, state.tabs.length - 1)]!.id;
    }
  }

  bus.emit("tab:closed", { filePath: tab.filePath });
}

export function closeCurrentTab(): void {
  if (state.activeTabId) closeTab(state.activeTabId);
}

export function setActiveTab(tabId: string): void {
  if (state.tabs.some(t => t.id === tabId)) {
    state.activeTabId = tabId;
  }
}

export function markDirty(tabId: string, dirty: boolean): void {
  const tab = state.tabs.find(t => t.id === tabId);
  if (tab) tab.dirty = dirty;
}

export function getActiveTab(): Tab | null {
  return state.tabs.find(t => t.id === state.activeTabId) ?? null;
}

export function getTabs(): Tab[] {
  return state.tabs;
}

export function getState(): WorkspaceState {
  return state;
}
