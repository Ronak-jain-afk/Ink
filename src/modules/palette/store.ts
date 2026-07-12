import { bus } from "../../system/events";

export interface PaletteAction {
  id: string;
  label: string;
  category: string;
  keybinding?: string;
  execute: () => void;
}

let actions: PaletteAction[] = [];
let currentQuery = "";
let selectedIdx = 0;
let isOpen = false;

export function registerAction(action: PaletteAction): () => void {
  actions.push(action);
  return () => { actions = actions.filter(a => a.id !== action.id); };
}

export function getActions(): PaletteAction[] {
  return actions;
}

export function searchActions(query: string): PaletteAction[] {
  currentQuery = query;
  const q = query.toLowerCase();
  return actions
    .filter(a => a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
    .sort((a, b) => {
      const aExact = a.label.toLowerCase() === q ? 0 : a.label.toLowerCase().startsWith(q) ? 1 : 2;
      const bExact = b.label.toLowerCase() === q ? 0 : b.label.toLowerCase().startsWith(q) ? 1 : 2;
      return aExact - bExact;
    });
}

export function openPalette(): void {
  isOpen = true;
  selectedIdx = 0;
  currentQuery = "";
  bus.emit("palette:open", {});
}

export function closePalette(): void {
  isOpen = false;
  bus.emit("palette:close", {});
}

export function isPaletteOpen(): boolean {
  return isOpen;
}

export function getSelectedIndex(): number {
  return selectedIdx;
}

export function selectNext(): void {
  const results = searchActions(currentQuery);
  selectedIdx = Math.min(selectedIdx + 1, results.length - 1);
}

export function selectPrev(): void {
  selectedIdx = Math.max(selectedIdx - 1, 0);
}

export function executeSelected(): void {
  const results = searchActions(currentQuery);
  const action = results[selectedIdx];
  if (action) {
    closePalette();
    action.execute();
  }
}
