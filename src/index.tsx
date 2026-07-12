import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App, openFileInEditor } from "./shell/App";
import { pickAndOpenFolder } from "./components/FileExplorer";
import { openTab } from "./modules/workspace/store";

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

  // Auto-open current folder
  setTimeout(() => pickAndOpenFolder(), 100);
}

main().catch((err) => {
  console.error("Ink failed to start:", err);
  process.exit(1);
});
