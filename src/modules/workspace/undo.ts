const MAX_HISTORY = 100;
const stacks = new Map<string, { undo: string[]; redo: string[]; lastPushed: string }>();

export function pushSnapshot(tabId: string, text: string): void {
  let s = stacks.get(tabId);
  if (!s) {
    s = { undo: [text], redo: [], lastPushed: text };
    stacks.set(tabId, s);
    return;
  }
  if (s.lastPushed === text) return;
  s.undo.push(text);
  if (s.undo.length > MAX_HISTORY) s.undo.shift();
  s.redo = [];
  s.lastPushed = text;
}

export function undo(tabId: string): string | null {
  const s = stacks.get(tabId);
  if (!s || s.undo.length <= 1) return null;
  const current = s.undo.pop()!;
  s.redo.push(current);
  s.lastPushed = s.undo[s.undo.length - 1]!;
  return s.lastPushed;
}

export function redo(tabId: string): string | null {
  const s = stacks.get(tabId);
  if (!s || s.redo.length === 0) return null;
  const next = s.redo.pop()!;
  s.undo.push(next);
  s.lastPushed = next;
  return next;
}

export function clearStack(tabId: string): void {
  stacks.delete(tabId);
}
