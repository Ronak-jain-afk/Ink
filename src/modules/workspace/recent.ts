import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const RECENT_FILE = join(homedir(), ".ink", "recent.json");
const MAX_RECENT = 10;

interface RecentEntry {
  path: string;
  lastOpened: number;
}

function ensureDir(): void {
  const dir = join(homedir(), ".ink");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function loadAll(): RecentEntry[] {
  try {
    if (!existsSync(RECENT_FILE)) return [];
    return JSON.parse(readFileSync(RECENT_FILE, "utf-8")) as RecentEntry[];
  } catch {
    return [];
  }
}

function saveAll(entries: RecentEntry[]): void {
  try {
    ensureDir();
    writeFileSync(RECENT_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch {
    // ponytail: silently skip
  }
}

export function addRecentProject(projectPath: string): void {
  const entries = loadAll().filter(e => e.path !== projectPath);
  entries.unshift({ path: projectPath, lastOpened: Date.now() });
  saveAll(entries.slice(0, MAX_RECENT));
}

export function getRecentProjects(): RecentEntry[] {
  return loadAll();
}
