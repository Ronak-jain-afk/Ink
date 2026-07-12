export type SplitDirection = "vertical" | "horizontal";

export interface Pane {
  id: string;
  direction: SplitDirection;
  children?: Pane[];
  tabGroupId: string;
  size?: number; // fraction of parent (0-1)
}

let nextId = 0;
function genId(): string { return `pane-${nextId++}`; }

export interface SplitState {
  root: Pane | null;
}

const state: SplitState = {
  root: null,
};

export function initSplit(): Pane {
  const pane: Pane = { id: genId(), direction: "vertical", tabGroupId: "default" };
  state.root = pane;
  return pane;
}

export function splitPane(paneId: string, direction: SplitDirection): Pane | null {
  if (!state.root) return null;
  const parent = findParent(state.root, paneId);
  if (!parent) return null;
  const newPane: Pane = { id: genId(), direction, tabGroupId: genId() };
  if (!parent.children) {
    parent.children = [
      { id: paneId, direction: parent.direction, tabGroupId: parent.tabGroupId, size: 0.5 },
      { ...newPane, size: 0.5 },
    ];
    parent.tabGroupId = `group-${genId()}`;
  }
  return newPane;
}

export function closePane(paneId: string): void {
  if (!state.root) return;
  closePaneRecursive(state.root, null, paneId);
}

function closePaneRecursive(pane: Pane, parent: Pane | null, targetId: string): void {
  if (!pane.children) {
    if (pane.id === targetId && parent && parent.children) {
      parent.children = parent.children.filter(c => c.id !== targetId);
      if (parent.children.length === 1) {
        const sole = parent.children[0]!;
        parent.direction = sole.direction;
        parent.tabGroupId = sole.tabGroupId;
        parent.children = sole.children;
      }
    }
    return;
  }
  for (const child of pane.children) {
    closePaneRecursive(child, pane, targetId);
  }
}

function findParent(pane: Pane, targetId: string): Pane | null {
  if (pane.children?.some(c => c.id === targetId)) return pane;
  for (const child of pane.children ?? []) {
    const found = findParent(child, targetId);
    if (found) return found;
  }
  return null;
}

export function getSplitState(): SplitState {
  return state;
}
