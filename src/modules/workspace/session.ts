import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Tab } from "./store";

interface SessionData {
  tabs: { filePath: string }[];
  activeFilePath: string | null;
}

function getSessionPath(rootPath: string): string {
  return join(rootPath, ".ink", "session.json");
}

function ensureDir(rootPath: string): void {
  const dir = join(rootPath, ".ink");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function saveSession(rootPath: string, tabs: Tab[], activeFilePath: string | null): void {
  try {
    ensureDir(rootPath);
    const data: SessionData = {
      tabs: tabs.map(t => ({ filePath: t.filePath })),
      activeFilePath,
    };
    writeFileSync(getSessionPath(rootPath), JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // ponytail: silently skip — not critical
  }
}

export function loadSession(rootPath: string): SessionData | null {
  try {
    const path = getSessionPath(rootPath);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf-8")) as SessionData;
  } catch {
    return null;
  }
}
