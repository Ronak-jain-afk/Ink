import { Box } from "@opentui/core";
import type { Renderable } from "@opentui/core";
import { StatusBar } from "./StatusBar";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";

export interface AppShell {
  statusBar: ReturnType<typeof StatusBar>;
  sidebar: ReturnType<typeof Sidebar>;
  mainContent: ReturnType<typeof MainContent>;
  overlay: ReturnType<typeof Box>;
}

export function createAppShell(root: Renderable): AppShell {
  const statusBar = StatusBar();
  const sidebar = Sidebar();
  const mainContent = MainContent();

  const overlay = Box({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    visible: false,
  });

  const body = Box({
    flexGrow: 1,
    flexDirection: "row",
  }, sidebar.node, mainContent.node);

  const container = Box({
    width: "100%",
    height: "100%",
    flexDirection: "column",
  }, body, statusBar.node, overlay);

  root.add(container);

  return {
    statusBar,
    sidebar,
    mainContent,
    overlay,
  };
}
