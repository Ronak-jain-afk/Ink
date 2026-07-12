import { getTabs, getActiveTab, openTab } from "../modules/workspace/store";
import { readFileContent } from "../modules/workspace/file-system";
import { bus } from "../system/events";
import { FileExplorer } from "../components/FileExplorer";
import { getWordStats } from "../modules/workspace/word-stats";
import { getBreadcrumbs } from "../modules/workspace/breadcrumbs";
import { detectFrontmatter } from "../modules/workspace/frontmatter";
import { getSplitState, initSplit, type Pane } from "../modules/workspace/split";
import { parseMarkdown } from "../modules/preview/parser";
import { renderPreview } from "../modules/preview/renderer";
import { getTheme } from "../modules/themes/store";
import { PaletteOverlay } from "../components/PaletteOverlay";
import { OutlinePanel } from "../components/OutlinePanel";
import { Dashboard } from "../components/Dashboard";
import { getGitState } from "../modules/git/detect";
import { useState, useEffect } from "react";

let editorRef: any = null;
let setEditorTextExternal: ((t: string) => void) | null = null;

function hasSplits(pane: Pane | null): boolean {
  if (!pane) return false;
  return (pane.children?.length ?? 0) > 0;
}

function renderSplitPanes(pane: Pane): any {
  const fd = pane.direction === "vertical" ? "column" : "row";
  return (
    <box key={pane.id} flexGrow={1} flexDirection={fd}>
      {pane.children?.map(child => {
        if (child.children && child.children.length > 0) {
          return renderSplitPanes(child);
        }
        return <PaneEditor key={child.id} tabGroupId={child.tabGroupId} />;
      })}
    </box>
  );
}

function PaneEditor({ tabGroupId }: { tabGroupId: string }) {
  return (
    <box flexGrow={1} flexDirection="column">
      <box height={1} width="100%" flexDirection="row">
        <text content={` [${tabGroupId.slice(0, 6)}]`} />
      </box>
      <textarea flexGrow={1} wrapMode="char" />
    </box>
  );
}

export function App() {
  const [rev, setRev] = useState(0);
  const [editorText, setEditorText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const tabs = getTabs();
  const activeTab = getActiveTab();
  const hasEditor = tabs.length > 0;
  const stats = editorText ? getWordStats(editorText) : null;
  const splitState = getSplitState();

  useEffect(() => {
    if (!splitState.root) initSplit();
    setEditorTextExternal = setEditorText;
    return () => { setEditorTextExternal = null; };
  }, []);

  useEffect(() => {
    const unsubs = [
      bus.on("tab:opened", () => setRev(n => n + 1)),
      bus.on("tab:closed", () => setRev(n => n + 1)),
      bus.on("workspace:opened", () => setRev(n => n + 1)),
      bus.on("session:restored", () => setRev(n => n + 1)),
      bus.on("preview:toggle", () => setShowPreview(p => !p)),
      bus.on("theme:changed", () => setRev(n => n + 1)),
      bus.on("palette:open", () => setRev(n => n + 1)),
      bus.on("palette:close", () => setRev(n => n + 1)),
      bus.on("git:status-changed", () => setRev(n => n + 1)),
    ];
    return () => unsubs.forEach(fn => fn());
  }, []);

  const rootPane = splitState.root;
  const previewContent = editorText && showPreview ? renderPreview(parseMarkdown(editorText)) : null;
  const theme = getTheme();
  const git = getGitState();

  return (
    <box width="100%" height="100%" flexDirection="row" backgroundColor={theme.bg}>
      <box width={30} flexDirection="column">
        <FileExplorer rev={rev} />
        {editorText && (
          <OutlinePanel editorText={editorText} />
        )}
      </box>
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
        {activeTab && (
          <box height={1} width="100%">
            <text content={` ${getBreadcrumbs(activeTab.filePath)}`} />
            {editorText && detectFrontmatter(editorText).hasFrontmatter && (
              <text content={" [FM]"} />
            )}
          </box>
        )}

        <PaletteOverlay rev={rev} />
        {hasEditor && rootPane && hasSplits(rootPane) ? (
          renderSplitPanes(rootPane)
        ) : hasEditor ? (
          <box flexGrow={1} flexDirection="row">
            <textarea
              flexGrow={1}
              initialValue={editorText}
              wrapMode="char"
              ref={(el: any) => { editorRef = el; }}
              onContentChange={() => {
                if (editorRef?.getText) setEditorText(editorRef.getText());
              }}
            />
            {previewContent && (
              <box width="50%" flexDirection="column" paddingLeft={1}>
                <text content={previewContent} />
              </box>
            )}
          </box>
        ) : (
          <Dashboard />
        )}

        <box height={1} width="100%" flexDirection="row">
          <text content={` ${showPreview ? "PREVIEW" : "NORMAL"} `} />
          {git.isRepo && (
            <text content={` ${git.branch}${git.dirty ? " ●" : ""} `} />
          )}
          <box flexGrow={1} />
          {stats && (
            <text content={` ${stats.words}w ${stats.chars}c ${stats.readingTime}m `} />
          )}
          <text content={activeTab?.fileName ?? "No file open"} />
        </box>
      </box>
    </box>
  );
}

export async function openFileInEditor(filePath: string) {
  try {
    const { text } = await readFileContent(filePath);
    openTab(filePath);
    setEditorTextExternal?.(text);
  } catch (err) {
    console.error("Failed to open file:", err);
  }
}
