import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Tab } from "./store";
import type { Pane } from "./split";

interface TabState {
  filePath: string;
  cursorLine: number;
  cursorCol: number;
  scrollOffset: number;
}

interface SessionData {
  version: number;
  tabs: TabState[];
  activeFilePath: string | null;
  splitLayout: Pane | null;
  activeTabFileContents: Record<string, string>;
}

function getSessionPath(rootPath: string): string {
  return join(rootPath, ".ink", "session.json");
}

function ensureDir(rootPath: string): void {
  const dir = join(rootPath, ".ink");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function saveSession(
  rootPath: string,
  tabs: Tab[],
  activeFilePath: string | null,
  splitLayout: Pane | null = null,
  fileContents: Record<string, string> = {},
): void {
  try {
    ensureDir(rootPath);
    const data: SessionData = {
      version: 2,
      tabs: tabs.map(t => ({
        filePath: t.filePath,
        cursorLine: 0,
        cursorCol: 0,
        scrollOffset: 0,
      })),
      activeFilePath,
      splitLayout,
      activeTabFileContents: fileContents,
    };
    writeFileSync(getSessionPath(rootPath), JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // ponytail: silently skip
  }
}

export interface LoadedSession {
  tabs: { filePath: string }[];
  activeFilePath: string | null;
  splitLayout: Pane | null;
  fileContents: Record<string, string>;
}

export function loadSession(rootPath: string): LoadedSession | null {
  try {
    const path = getSessionPath(rootPath);
    if (!existsSync(path)) return null;
    const data = JSON.parse(readFileSync(path, "utf-8")) as SessionData;
    return {
      tabs: data.tabs.map(t => ({ filePath: t.filePath })),
      activeFilePath: data.activeFilePath ?? null,
      splitLayout: data.splitLayout ?? null,
      fileContents: data.activeTabFileContents ?? {},
    };
  } catch {
    return null;
  }
}
