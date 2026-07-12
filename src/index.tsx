import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App, openFileInEditor } from "./shell/App";
import { pickAndOpenFolder } from "./components/FileExplorer";
import { getTabs, getActiveTab, openTab } from "./modules/workspace/store";
import { loadSession, saveSession } from "./modules/workspace/session";
import { addRecentProject } from "./modules/workspace/recent";
import { getWorkspaceState } from "./modules/workspace/workspace-store";
import { detectTier } from "./modules/preview/tiers";
import { toggleTheme } from "./modules/themes/store";
import { registerAction, openPalette, closePalette, executeSelected, selectNext, selectPrev, isPaletteOpen } from "./modules/palette/store";
import { stageAll, unstageAll } from "./modules/git/staging";
import { showActiveFileDiff } from "./modules/git/diff-store";
import { commit as doGitCommit } from "./modules/git/commit";
import { listBranches, switchBranch } from "./modules/git/branches";
import { bus } from "./system/events";

function saveCurrentSession(): void {
  const ws = getWorkspaceState();
  if (ws.rootPath) {
    saveSession(ws.rootPath, getTabs(), getActiveTab()?.filePath ?? null);
  }
}

function registerCoreActions(): void {
  registerAction({
    id: "preview.toggle",
    label: "Toggle Preview",
    category: "View",
    keybinding: "Ctrl+Shift+P",
    execute: () => bus.emit("preview:toggle", {}),
  });
  registerAction({
    id: "theme.toggle",
    label: "Toggle Theme (Dark/Light)",
    category: "Preferences",
    keybinding: "Ctrl+Shift+T",
    execute: () => { toggleTheme(); },
  });
  registerAction({
    id: "palette.open",
    label: "Command Palette",
    category: "Navigation",
    keybinding: "Ctrl+P",
    execute: () => openPalette(),
  });
  registerAction({
    id: "git.stageAll",
    label: "Stage All Changes",
    category: "Git",
    execute: () => { const ws = getWorkspaceState(); if (ws.rootPath) stageAll(ws.rootPath); },
  });
  registerAction({
    id: "git.unstageAll",
    label: "Unstage All Changes",
    category: "Git",
    execute: () => { const ws = getWorkspaceState(); if (ws.rootPath) unstageAll(ws.rootPath); },
  });
  registerAction({
    id: "git.showDiff",
    label: "Show File Diff",
    category: "Git",
    execute: () => { showActiveFileDiff(); bus.emit("diff:show", {}); },
  });
  registerAction({
    id: "git.listBranches",
    label: "List Branches",
    category: "Git",
    execute: () => {
      const ws = getWorkspaceState();
      if (!ws.rootPath) return;
      const branches = listBranches(ws.rootPath);
      console.log(branches.map(b => `${b.current ? "*" : " "} ${b.name}`).join("\n"));
    },
  });
  registerAction({
    id: "git.quickCommit",
    label: "Quick Commit (auto message)",
    category: "Git",
    execute: () => {
      const ws = getWorkspaceState();
      if (ws.rootPath) doGitCommit(ws.rootPath);
    },
  });
}

async function main() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useMouse: true,
    screenMode: "alternate-screen",
    targetFps: 30,
  });

  const root = createRoot(renderer);
  root.render(<App />);
  renderer.start();

  registerCoreActions();

  renderer.on("capabilities", () => {
    const caps = renderer.capabilities;
    if (caps) detectTier({ trueColor: caps.rgb, unicode: caps.unicode === "unicode" });
    renderer.requestRender();
  });

  setTimeout(async () => {
    await pickAndOpenFolder();
    const ws = getWorkspaceState();
    if (ws.rootPath) {
      addRecentProject(ws.rootPath);
      bus.emit("recent:updated", {});
      const session = loadSession(ws.rootPath);
      if (session) {
        for (const t of session.tabs) {
          openTab(t.filePath);
        }
        bus.emit("session:restored", {});
      }
    }
  }, 100);

  bus.on("tab:opened", saveCurrentSession);
  bus.on("tab:closed", saveCurrentSession);

  renderer.keyInput.on("keypress", (event) => {
    if (event.ctrl && event.shift && event.name === "p") {
      bus.emit("preview:toggle", {});
    }
    if (event.ctrl && event.shift && event.name === "t") {
      toggleTheme();
      renderer.requestRender();
    }
    if (event.ctrl && event.name === "p") {
      openPalette();
    }
    if (event.name === "escape") {
      if (isPaletteOpen()) closePalette();
      bus.emit("diff:close", {});
    }
    if (isPaletteOpen()) {
      if (event.name === "enter") executeSelected();
      else if (event.name === "down") selectNext();
      else if (event.name === "up") selectPrev();
    }
  });
}

main().catch((err) => {
  console.error("Ink failed to start:", err);
  process.exit(1);
});
