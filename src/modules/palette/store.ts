import { bus } from "../../system/events";
import { getActiveTab } from "../workspace/store";
import { getGitState } from "../git/detect";

export interface PaletteAction {
  id: string;
  label: string;
  category: string;
  keybinding?: string;
  context?: string[]; // contexts where this action is visible: "editor", "git", "no-file", "dashboard"
  execute: () => void;
}

let actions: PaletteAction[] = [];
let currentQuery = "";
let selectedIdx = 0;
let isOpen = false;

// ponytail: inline input for actions like rename/create
let inlineInputFn: ((input: string) => void) | null = null;
export function setInlineInput(fn: ((input: string) => void) | null): void {
  inlineInputFn = fn;
}
export function getInlineInput(): ((input: string) => void) | null {
  return inlineInputFn;
}

export function registerAction(action: PaletteAction): () => void {
  actions.push(action);
  return () => { actions = actions.filter(a => a.id !== action.id); };
}

function getActiveContexts(): string[] {
  const ctx: string[] = [];
  const tab = getActiveTab();
  if (tab) ctx.push("editor");
  else ctx.push("dashboard");
  const git = getGitState();
  if (git.isRepo) ctx.push("git");
  return ctx;
}

export function getActions(): PaletteAction[] {
  const ctx = getActiveContexts();
  return actions.filter(a => !a.context || a.context.some(c => ctx.includes(c)));
}

export function searchActions(query: string): PaletteAction[] {
  currentQuery = query;
  const q = query.toLowerCase();
  const ctx = getActiveContexts();
  return actions
    .filter(a => (!a.context || a.context.some(c => ctx.includes(c))) &&
      (a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)))
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
  inlineInputFn = null;
  bus.emit("palette:open", {});
}

export function closePalette(): void {
  isOpen = false;
  inlineInputFn = null;
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
    if (inlineInputFn) {
      inlineInputFn(currentQuery);
      inlineInputFn = null;
    } else {
      closePalette();
      action.execute();
    }
  }
}
