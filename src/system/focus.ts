import { bus } from "./events";

type PaneId = string;

class FocusManager {
  private panes = new Set<PaneId>();
  private activePane: PaneId | null = null;

  registerPane(id: PaneId): void {
    this.panes.add(id);
  }

  unregisterPane(id: PaneId): void {
    this.panes.delete(id);
    if (this.activePane === id) {
      this.setActive(null);
    }
  }

  setActive(paneId: PaneId | null): void {
    if (paneId && !this.panes.has(paneId)) return;
    this.activePane = paneId;
    bus.emit("focus:changed", { paneId });
  }

  getActive(): PaneId | null {
    return this.activePane;
  }

  focusNext(): void {
    const arr = Array.from(this.panes);
    if (arr.length === 0) return;
    const idx = this.activePane ? arr.indexOf(this.activePane) : -1;
    this.setActive(arr[(idx + 1) % arr.length]!);
  }

  focusPrevious(): void {
    const arr = Array.from(this.panes);
    if (arr.length === 0) return;
    const idx = this.activePane ? arr.indexOf(this.activePane) : 0;
    this.setActive(arr[(idx - 1 + arr.length) % arr.length]!);
  }
}

export const focus = new FocusManager();
