import { darkTheme, lightTheme, type ThemeTokens } from "./tokens";
import { bus } from "../../system/events";

export type ThemeMode = "dark" | "light";

let currentMode: ThemeMode = "dark";
let currentTheme: ThemeTokens = darkTheme;

export function setTheme(mode: ThemeMode): void {
  currentMode = mode;
  currentTheme = mode === "dark" ? darkTheme : lightTheme;
  bus.emit("theme:changed", { theme: mode });
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
