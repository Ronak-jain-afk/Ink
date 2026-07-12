import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { darkTheme, lightTheme, type ThemeTokens } from "./tokens";

export function loadCustomTheme(filePath: string): ThemeTokens | null {
  try {
    if (!existsSync(filePath)) return null;
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    // Merge against the closest built-in theme for defaults
    const base = raw.name?.includes("light") ? lightTheme : darkTheme;
    return deepMerge(base, raw) as ThemeTokens;
  } catch {
    return null;
  }
}

export function loadWorkspaceTheme(rootPath: string): ThemeTokens | null {
  const paths = [
    join(rootPath, ".ink", "theme.json"),
    join(rootPath, ".ink", "theme.jsonc"),
  ];
  for (const p of paths) {
    const theme = loadCustomTheme(p);
    if (theme) return theme;
  }
  return null;
}

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
