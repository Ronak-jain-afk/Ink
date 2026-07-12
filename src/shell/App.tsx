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
import { getCurrentDiff } from "../modules/git/diff-store";
import { getConversation } from "../modules/ai/panel-store";
import { AIPanel } from "../components/AIPanel";
import { getMode, getModeSettings } from "../modules/modes/store";
import { setEditorText as setSharedEditorText } from "../modules/workspace/workspace-store";
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
  const [showDiff, setShowDiff] = useState(false);
  const tabs = getTabs();
  const activeTab = getActiveTab();
  const hasEditor = tabs.length > 0;
  const stats = editorText ? getWordStats(editorText) : null;
  const splitState = getSplitState();

  useEffect(() => {
    if (!splitState.root) initSplit();
    setEditorTextExternal = setEditorText;
    setSharedEditorText(editorText);
    return () => { setEditorTextExternal = null; };
  }, [editorText]);

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
      bus.on("diff:show", () => { setShowDiff(true); setRev(n => n + 1); }),
      bus.on("diff:close", () => { setShowDiff(false); setRev(n => n + 1); }),
      bus.on("mode:changed", ({ mode }) => { setShowDiff(mode === "review"); setRev(n => n + 1); }),
      bus.on("ai:update", () => setRev(n => n + 1)),
    ];
    return () => unsubs.forEach(fn => fn());
  }, []);

  const rootPane = splitState.root;
  const previewContent = editorText && showPreview ? renderPreview(parseMarkdown(editorText)) : null;
  const theme = getTheme();
  const git = getGitState();
  const currentMode = getMode();
  const modeSettings = getModeSettings();

  const editorWidth = modeSettings.fullWidth ? 100 : modeSettings.showSidebars ? 50 : 80;
  const sidebarWidth = currentMode === "ai" ? 50 : currentMode === "git" ? 45 : 30;
  const showDiffByDefault = currentMode === "review";

  return (
    <box width="100%" height="100%" flexDirection="row" backgroundColor={theme.bg}>
      {modeSettings.showSidebars && (
        <box width={sidebarWidth} flexDirection="column">
          <FileExplorer rev={rev} />
          {editorText && (
            <OutlinePanel editorText={editorText} />
          )}
          <AIPanel />
        </box>
      )}
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
        {showDiff && (
          <box flexGrow={1} flexDirection="column" paddingLeft={1}>
            <text content={getCurrentDiff() ?? "(no diff)"} />
          </box>
        )}
        {!showDiff && hasEditor && rootPane && hasSplits(rootPane) ? (
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

        {modeSettings.showStatusBar && (
          <box height={1} width="100%" flexDirection="row">
            <text content={` ${currentMode.toUpperCase()} `} />
            {git.isRepo && (
              <text content={` ${git.branch}${git.dirty ? " ●" : ""} `} />
            )}
            <box flexGrow={1} />
            {stats && (
              <text content={` ${stats.words}w ${stats.chars}c ${stats.readingTime}m `} />
            )}
            <text content={activeTab?.fileName ?? "No file open"} />
          </box>
        )}
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
