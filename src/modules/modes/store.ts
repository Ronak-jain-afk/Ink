import { bus } from "../../system/events";

export type WorkspaceMode = "normal" | "writing" | "review" | "git" | "ai" | "presentation" | "distraction-free";

const state: { mode: WorkspaceMode; settings: Record<string, boolean> } = {
  mode: "normal",
  settings: {
    showSidebars: true,
    showStatusBar: true,
    fullWidth: false,
  },
};

export function setMode(mode: WorkspaceMode): void {
  state.mode = mode;
  if (mode === "distraction-free") {
    state.settings.showSidebars = false;
    state.settings.showStatusBar = false;
    state.settings.fullWidth = true;
  } else if (mode === "presentation") {
    state.settings.showSidebars = false;
    state.settings.showStatusBar = true;
    state.settings.fullWidth = true;
  } else if (mode === "ai") {
    state.settings.showSidebars = true;
    state.settings.showStatusBar = true;
    state.settings.fullWidth = false;
  } else if (mode === "git") {
    state.settings.showSidebars = true;
    state.settings.showStatusBar = true;
    state.settings.fullWidth = false;
  } else {
    state.settings.showSidebars = true;
    state.settings.showStatusBar = true;
    state.settings.fullWidth = false;
  }
  bus.emit("mode:changed", { mode });
}

export function getMode(): WorkspaceMode {
  return state.mode;
}

export function getModeSettings() {
  return state.settings;
}
