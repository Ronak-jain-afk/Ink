import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface WorkspaceSettings {
  showHidden?: boolean;
  tabSize?: number;
  wordWrap?: boolean;
  largeFileThreshold?: number;
}

const DEFAULTS: WorkspaceSettings = {
  showHidden: false,
  tabSize: 4,
  wordWrap: true,
  largeFileThreshold: 1024 * 10,
};

let current: WorkspaceSettings = { ...DEFAULTS };

function configPath(rootPath: string): string {
  return join(rootPath, ".ink", "config.json");
}

export function loadSettings(rootPath: string): WorkspaceSettings {
  try {
    const path = configPath(rootPath);
    if (!existsSync(path)) {
      current = { ...DEFAULTS };
      return current;
    }
    current = { ...DEFAULTS, ...JSON.parse(readFileSync(path, "utf-8")) };
    return current;
  } catch {
    current = { ...DEFAULTS };
    return current;
  }
}

export function saveSettings(rootPath: string, overrides: Partial<WorkspaceSettings>): void {
  try {
    current = { ...current, ...overrides };
    const dir = join(rootPath, ".ink");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(configPath(rootPath), JSON.stringify(current, null, 2), "utf-8");
  } catch {
    // ponytail: silently skip
  }
}

export function getSettings(): WorkspaceSettings {
  return current;
}
