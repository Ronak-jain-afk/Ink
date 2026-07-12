import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App, openFileInEditor } from "./shell/App";
import { pickAndOpenFolder } from "./components/FileExplorer";
import { getTabs, getActiveTab, openTab } from "./modules/workspace/store";
import { loadSession, saveSession } from "./modules/workspace/session";
import { getWorkspaceState } from "./modules/workspace/workspace-store";
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
    renderer.requestRender();
  });

  setTimeout(async () => {
    await pickAndOpenFolder();
    const ws = getWorkspaceState();
    if (ws.rootPath) {
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
}

main().catch((err) => {
  console.error("Ink failed to start:", err);
  process.exit(1);
});
