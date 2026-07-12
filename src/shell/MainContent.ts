import { Box, Text } from "@opentui/core";

export function MainContent() {
  const welcome = Text({
    content: " Ink — Markdown Workspace\n\n Open a folder to get started.\n Press Ctrl+P to open the command palette.",
  });

  const area = Box({
    flexGrow: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  }, welcome);

  return { node: area };
}
