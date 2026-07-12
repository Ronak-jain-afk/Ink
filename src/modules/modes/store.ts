import { bus } from "../../system/events";

export type WorkspaceMode = "normal" | "writing" | "review" | "git" | "ai" | "presentation" | "distraction-free";

const state: { mode: WorkspaceMode } = { mode: "normal" };

export function setMode(mode: WorkspaceMode): void {
  state.mode = mode;
  bus.emit("mode:changed", { mode });
}

export function getMode(): WorkspaceMode {
  return state.mode;
}
