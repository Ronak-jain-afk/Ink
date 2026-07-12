import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App, openFileInEditor } from "./shell/App";
import { pickAndOpenFolder } from "./components/FileExplorer";
import { getTabs, getActiveTab, openTab } from "./modules/workspace/store";
import { loadSession, saveSession } from "./modules/workspace/session";
import { addRecentProject } from "./modules/workspace/recent";
import { getWorkspaceState } from "./modules/workspace/workspace-store";
import { detectTier } from "./modules/preview/tiers";
import { bus } from "./system/events";

function saveCurrentSession(): void {
  const ws = getWorkspaceState();
  if (ws.rootPath) {
    saveSession(ws.rootPath, getTabs(), getActiveTab()?.filePath ?? null);
  }
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
  });
}

main().catch((err) => {
  console.error("Ink failed to start:", err);
  process.exit(1);
});
