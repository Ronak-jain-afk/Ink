import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App, openFileInEditor } from "./shell/App";
import { pickAndOpenFolder } from "./components/FileExplorer";
import { getTabs, getActiveTab, openTab } from "./modules/workspace/store";
import { loadSession, saveSession } from "./modules/workspace/session";
import { addRecentProject } from "./modules/workspace/recent";
import { getWorkspaceState, getEditorText } from "./modules/workspace/workspace-store";
import { detectTier } from "./modules/preview/tiers";
import { toggleTheme } from "./modules/themes/store";
import { registerAction, openPalette, closePalette, executeSelected, selectNext, selectPrev, isPaletteOpen } from "./modules/palette/store";
import { stageAll, unstageAll } from "./modules/git/staging";
import { showActiveFileDiff } from "./modules/git/diff-store";
import { commit as doGitCommit } from "./modules/git/commit";
import { listBranches, switchBranch } from "./modules/git/branches";
import { fetch as gitFetch, pull as gitPull, push as gitPush } from "./modules/git/remote";
import { getLog } from "./modules/git/log";
import { startGitPolling } from "./modules/git/watch";
import { acceptAll, rejectAll, getPendingEdits } from "./modules/ai/diff-review";
import { registerDefaultCommands, listSlashCommands, executeSlashCommand } from "./modules/ai/slash";
import { rewriteSelection, summarizeSelection, explainSelection, translateSelection } from "./modules/ai/selection-actions";
import { cancelCurrentRequest } from "./modules/ai/cancellation";
import { setMode, type WorkspaceMode } from "./modules/modes/store";
import { exportHTML } from "./modules/export/store";
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
    id: "git.showLog",
    label: "Show Commit History",
    category: "Git",
    execute: () => {
      const ws = getWorkspaceState();
      if (!ws.rootPath) return;
      const log = getLog(ws.rootPath, 10);
      console.log(log.map(c => `${c.hash.slice(0, 7)} ${c.date} ${c.author}: ${c.message}`).join("\n"));
    },
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
    id: "git.fetch",
    label: "Fetch",
    category: "Git",
    execute: () => { const ws = getWorkspaceState(); if (ws.rootPath) gitFetch(ws.rootPath); },
  });
  registerAction({
    id: "git.pull",
    label: "Pull",
    category: "Git",
    execute: () => { const ws = getWorkspaceState(); if (ws.rootPath) gitPull(ws.rootPath); },
  });
  registerAction({
    id: "git.push",
    label: "Push",
    category: "Git",
    execute: () => { const ws = getWorkspaceState(); if (ws.rootPath) gitPush(ws.rootPath); },
  });
  registerDefaultCommands();

  const modes: WorkspaceMode[] = ["normal", "writing", "review", "git", "ai", "presentation", "distraction-free"];
  for (const m of modes) {
    registerAction({
      id: `mode.${m}`,
      label: `Switch to ${m.charAt(0).toUpperCase() + m.slice(1)} Mode`,
      category: "Mode",
      execute: () => setMode(m),
    });
  }

  registerAction({
    id: "file.exportHTML",
    label: "Export to HTML",
    category: "File",
    execute: () => {
      const tab = getActiveTab();
      if (!tab) return;
      const path = tab.filePath.replace(/\.md$/, ".html");
      exportHTML(getEditorText(), path);
    },
  });

  registerAction({ id: "ai.cancel", label: "Cancel AI Request", category: "AI", execute: () => cancelCurrentRequest() });
  registerAction({ id: "ai.rewrite", label: "Rewrite Selection", category: "AI", execute: () => rewriteSelection() });
  registerAction({ id: "ai.summarize", label: "Summarize Selection", category: "AI", execute: () => summarizeSelection() });
  registerAction({ id: "ai.explain", label: "Explain Selection", category: "AI", execute: () => explainSelection() });
  registerAction({ id: "ai.translate", label: "Translate Selection", category: "AI", execute: () => translateSelection() });

  // Register slash commands as palette actions
  for (const cmd of listSlashCommands()) {
    registerAction({
      id: `slash.${cmd.name}`,
      label: `/${cmd.name} — ${cmd.description}`,
      category: "AI",
      execute: () => {
        const ws = getWorkspaceState();
        const text = getActiveTab() ? "" : ""; // TODO: pass active file content
        executeSlashCommand(cmd.name, "", text);
      },
    });
  }

  registerAction({
    id: "ai.acceptAllEdits",
    label: "Accept All AI Edits",
    category: "AI",
    execute: () => { acceptAll(); bus.emit("ai:update", {}); },
  });
  registerAction({
    id: "ai.rejectAllEdits",
    label: "Reject All AI Edits",
    category: "AI",
    execute: () => { rejectAll(); bus.emit("ai:update", {}); },
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

  startGitPolling(5000);

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
