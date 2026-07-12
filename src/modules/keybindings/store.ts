import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bus } from "../../system/events";

export interface KeyBinding {
  id: string;
  keys: string;
  label: string;
  action: () => void;
}

let bindings: KeyBinding[] = [];

export function registerKeybinding(b: KeyBinding): void {
  bindings = bindings.filter(k => k.id !== b.id);
  bindings.push(b);
}

export function getKeybindings(): KeyBinding[] {
  return bindings;
}

export function getKeyForAction(id: string): string | null {
  return bindings.find(b => b.id === id)?.keys ?? null;
}

export function remapKey(id: string, newKeys: string): void {
  const b = bindings.find(k => k.id === id);
  if (!b) return;
  b.keys = newKeys;
}

function detectConflicts(): string[] {
  const keyMap = new Map<string, string[]>();
  for (const b of bindings) {
    const existing = keyMap.get(b.keys) ?? [];
    existing.push(b.id);
    keyMap.set(b.keys, existing);
  }
  const conflicts: string[] = [];
  for (const [keys, ids] of keyMap) {
    if (ids.length > 1) conflicts.push(`${keys}: ${ids.join(", ")}`);
  }
  return conflicts;
}

export function getConflicts(): string[] {
  return detectConflicts();
}

// ponytail: persistent keybinding overrides via .ink/keybindings.json
export function saveOverrides(rootPath: string): void {
  try {
    const dir = join(rootPath, ".ink");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const overrides: Record<string, string> = {};
    for (const b of bindings) overrides[b.id] = b.keys;
    writeFileSync(join(dir, "keybindings.json"), JSON.stringify(overrides, null, 2), "utf-8");
  } catch { /* skip */ }
}

export function loadOverrides(rootPath: string): void {
  try {
    const path = join(rootPath, ".ink", "keybindings.json");
    if (!existsSync(path)) return;
    const overrides = JSON.parse(readFileSync(path, "utf-8")) as Record<string, string>;
    for (const [id, keys] of Object.entries(overrides)) {
      const b = bindings.find(k => k.id === id);
      if (b) b.keys = keys;
    }
  } catch { /* skip */ }
}
