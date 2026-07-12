import { darkTheme, lightTheme, type ThemeTokens } from "./tokens";
import { loadWorkspaceTheme } from "./loader";
import { bus } from "../../system/events";

export type ThemeMode = "dark" | "light";

let currentMode: ThemeMode = "dark";
let currentTheme: ThemeTokens = darkTheme;

export function setTheme(mode: ThemeMode, customTheme?: ThemeTokens): void {
  currentMode = mode;
  currentTheme = customTheme ?? (mode === "dark" ? darkTheme : lightTheme);
  bus.emit("theme:changed", { theme: mode });
}

export function loadThemeForWorkspace(rootPath: string): void {
  const custom = loadWorkspaceTheme(rootPath);
  if (custom) {
    currentTheme = custom;
    currentMode = custom.name?.includes("light") ? "light" : "dark";
    bus.emit("theme:changed", { theme: currentMode });
  }
}

export function getTheme(): ThemeTokens {
  return currentTheme;
}

export function getThemeMode(): ThemeMode {
  return currentMode;
}

export function toggleTheme(): void {
  setTheme(currentMode === "dark" ? "light" : "dark");
}
