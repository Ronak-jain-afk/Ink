import type { ThemeTokens } from "./tokens";

export interface DerivedPalette {
  hex: string;
  ansi256: string;
  ansi: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToAnsi256(r: number, g: number, b: number): number {
  // ponytail: approximate 6x6x6 cube
  const ri = Math.round((r / 255) * 5);
  const gi = Math.round((g / 255) * 5);
  const bi = Math.round((b / 255) * 5);
  return 16 + 36 * ri + 6 * gi + bi;
}

function rgbToAnsi(r: number, g: number, b: number): number {
  // ponytail: closest basic ANSI color (0-15)
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  if (r < 128 && g < 128 && b < 128) return gray < 64 ? 0 : 8;
  if (r > 128 && g > 128 && b > 128) return gray > 192 ? 15 : 7;
  if (r > g && r > b) return r > 128 ? 9 : 1;
  if (g > r && g > b) return g > 128 ? 10 : 2;
  if (b > r && b > g) return b > 128 ? 12 : 4;
  if (r > 128 && g > 128) return r > 128 ? 11 : 3;
  return gray > 128 ? 7 : 0;
}

export function derivePalette(hex: string): DerivedPalette {
  const [r, g, b] = hexToRgb(hex);
  return {
    hex,
    ansi256: `\x1b[38;5;${rgbToAnsi256(r, g, b)}m`,
    ansi: `\x1b[${rgbToAnsi(r, g, b) + 30}m`,
  };
}

export function deriveThemePalette(theme: ThemeTokens): Record<string, DerivedPalette> {
  const result: Record<string, DerivedPalette> = {};
  for (const [key, value] of Object.entries(theme)) {
    if (typeof value === "string" && value.startsWith("#")) {
      result[key] = derivePalette(value);
    }
  }
  // Flatten syntax and callout sub-objects
  for (const [group, items] of Object.entries(theme)) {
    if (items && typeof items === "object") {
      for (const [key, value] of Object.entries(items as Record<string, string>)) {
        if (value.startsWith("#")) {
          result[`${group}.${key}`] = derivePalette(value);
        }
      }
    }
  }
  return result;
}
