import { createCliRenderer } from "@opentui/core";
import { registry } from "./system/registry";
import { focus } from "./system/focus";
import { capabilities } from "./system/capabilities";
import { createAppShell } from "./shell/App";
import type { InkModule } from "./system/registry";

async function main() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useMouse: true,
    screenMode: "alternate-screen",
    targetFps: 30,
  });

  const shell = createAppShell(renderer.root);

  focus.registerPane("sidebar");
  focus.registerPane("main");
  focus.setActive("main");

  renderer.root.onKeyDown = (key) => {
    if (key.ctrl && key.code === "Backquote") {
      focus.focusNext();
      return true;
    }
    if (key.ctrl && key.code === "KeyQ") {
      renderer.destroy();
      process.exit(0);
      return true;
    }
    return false;
  };

  shell.statusBar.setMode("NORMAL");
  shell.statusBar.setFileInfo("Ready");

  await capabilities.detect();

  const rootModule: InkModule = {
    key: "root",
    init() {},
  };

  await registry.register(rootModule);

  renderer.start();

  renderer.on("resize", () => {
    renderer.requestRender();
  });
}

main().catch((err) => {
  console.error("Ink failed to start:", err);
  process.exit(1);
});
