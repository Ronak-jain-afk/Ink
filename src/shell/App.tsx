import { getTabs, getActiveTab, openTab } from "../modules/workspace/store";
import { readFileContent } from "../modules/workspace/file-system";
import { bus } from "../system/events";
import { FileExplorer } from "../components/FileExplorer";
import { useState, useEffect } from "react";

let editorRef: any = null;
let editorText = "";

export function App() {
  const [rev, setRev] = useState(0);
  const tabs = getTabs();
  const activeTab = getActiveTab();
  const hasEditor = tabs.length > 0;

  useEffect(() => {
    const unsubs = [
      bus.on("tab:opened", () => setRev(n => n + 1)),
      bus.on("tab:closed", () => setRev(n => n + 1)),
      bus.on("workspace:opened", () => setRev(n => n + 1)),
    ];
    return () => unsubs.forEach(fn => fn());
  }, []);

  return (
    <box width="100%" height="100%" flexDirection="row">
      <FileExplorer rev={rev} />
      <box flexGrow={1} flexDirection="column">
        <box height={1} width="100%" flexDirection="row">
          {tabs.length === 0 ? (
            <text content={" No file open"} />
          ) : (
            tabs.map(t => (
              <text key={t.id} content={t.dirty ? ` ${t.fileName} ●` : ` ${t.fileName} `} />
            ))
          )}
        </box>

        {hasEditor ? (
          <textarea
            flexGrow={1}
            initialValue={editorText}
            wrapMode="char"
            ref={(el: any) => { editorRef = el; }}
          />
        ) : (
          <box flexGrow={1} flexDirection="column" alignItems="center" justifyContent="center">
            <text content={" Ink — Markdown Workspace\n\n Open a folder to get started.\n Press Ctrl+P to open the command palette."} />
          </box>
        )}

        <box height={1} width="100%" flexDirection="row">
          <text content={" NORMAL "} />
          <box flexGrow={1} />
          <text content={activeTab?.fileName ?? "No file open"} />
        </box>
      </box>
    </box>
  );
}

export async function openFileInEditor(filePath: string) {
  try {
    const { text } = await readFileContent(filePath);
    editorText = text;
    openTab(filePath);
  } catch (err) {
    console.error("Failed to open file:", err);
  }
}
