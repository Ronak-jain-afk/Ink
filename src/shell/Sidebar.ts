import { Box, Text } from "@opentui/core";

export function Sidebar() {
  const title = Text({ content: " EXPLORER " });
  const body = Text({ content: "  (no folder open)" });

  const panel = Box({
    width: 30,
    flexDirection: "column",
    backgroundColor: "",
  }, title, body);

  return {
    node: panel,
    show: () => panel.visible = true,
    hide: () => panel.visible = false,
    toggle: () => panel.visible = !panel.visible,
  };
}
