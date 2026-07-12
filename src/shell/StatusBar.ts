import { Box, Text } from "@opentui/core";

export function StatusBar() {
  const mode = Text({ content: " NORMAL " });
  const fileInfo = Text({ content: " No file open " });
  const gitInfo = Text({ content: "", visible: false });
  const cursorInfo = Text({ content: "" });
  const providerInfo = Text({ content: "", visible: false });

  const bar = Box({
    height: 1,
    width: "100%",
    flexDirection: "row",
    backgroundColor: "",
  },
    Box({
      flexGrow: 0,
      flexDirection: "row",
      paddingLeft: 1,
      gap: 2,
    }, mode, fileInfo),
    Box({ flexGrow: 1 }),
    Box({
      flexGrow: 0,
      flexDirection: "row",
      paddingRight: 1,
      gap: 2,
    }, gitInfo, cursorInfo, providerInfo),
  );

  return {
    node: bar,
    setMode: (m: string) => { (mode as any).content = m; },
    setFileInfo: (info: string) => { (fileInfo as any).content = info; },
    setGitInfo: (info: string) => { (gitInfo as any).content = info; gitInfo.visible = !!info; },
    setCursorInfo: (info: string) => { (cursorInfo as any).content = info; },
    setProviderInfo: (info: string) => { (providerInfo as any).content = info; providerInfo.visible = !!info; },
  };
}
