import { bus } from "../../system/events";

export interface KeyBinding {
  id: string;
  keys: string;
  label: string;
  action: () => void;
}

let bindings: KeyBinding[] = [];

export function registerKeybinding(b: KeyBinding): void {
  bindings.push(b);
}

export function getKeybindings(): KeyBinding[] {
  return bindings;
}

// ponytail: keybinding display in palette and remapping deferred
export function getKeyForAction(id: string): string | null {
  return bindings.find(b => b.id === id)?.keys ?? null;
}

export function initDefaultBindings(): void {
  const reg = (id: string, keys: string, action: () => void) => {
    registerKeybinding({ id, keys, label: id, action });
  };

  reg("palette.open", "ctrl+p", () => bus.emit("palette:open", { mode: "actions" }));
  reg("file.open", "ctrl+o", () => {}); // placeholder — wired separately
  reg("file.save", "ctrl+s", () => bus.emit("file:saved", { filePath: "" }));
  reg("file.close", "ctrl+w", () => bus.emit("tab:closed", { filePath: "" }));
  reg("search.files", "ctrl+p", () => bus.emit("palette:open", {}));
  reg("search.content", "ctrl+shift+f", () => bus.emit("search:executed", { query: "" }));
  reg("preview.toggle", "ctrl+shift+p", () => bus.emit("preview:toggle", {}));
  reg("theme.toggle", "ctrl+shift+t", () => bus.emit("theme:changed", { theme: "" }));
  reg("diff.show", "ctrl+d", () => bus.emit("diff:show", {}));
}
