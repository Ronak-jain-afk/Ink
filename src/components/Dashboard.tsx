import { useState } from "react";
import { getRecentProjects } from "../modules/workspace/recent";
import { getTabs, closeTab } from "../modules/workspace/store";
import { getGitState } from "../modules/git/detect";
import { getWorkspaceState } from "../modules/workspace/workspace-store";
import { openFileInEditor } from "../shell/App";
import { getLog } from "../modules/git/log";

// ponytail: sections are hardcoded with toggle state; reorderable sections deferred
interface Section { id: string; label: string; collapsed: boolean; }

export function Dashboard() {
  const [sections, setSections] = useState<Section[]>([
    { id: "recent", label: "Recent Projects", collapsed: false },
    { id: "git", label: "Git Status", collapsed: false },
    { id: "quick", label: "Quick Actions", collapsed: false },
  ]);

  const recents = getRecentProjects();
  const git = getGitState();
  const rootPath = getWorkspaceState().rootPath;
  const log = rootPath ? getLog(rootPath, 5) : [];

  function toggle(id: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, collapsed: !s.collapsed } : s));
  }

  return (
    <box flexGrow={1} flexDirection="column" paddingLeft={2}>
      <text content={" Ink — Markdown Workspace"} />
      <text content={""} />
      {sections.map(sec => (
        <box key={sec.id} flexDirection="column">
          <box height={1} onMouseDown={() => toggle(sec.id)}>
            <text content={` ${sec.collapsed ? "▶" : "▼"} ${sec.label}`} />
          </box>
          {!sec.collapsed && sec.id === "recent" && recents.length > 0 && (
            <box flexDirection="column" paddingLeft={2}>
              {recents.map(r => (
                <box key={r.path} height={1} onMouseDown={async () => {
                  const { openWorkspace } = await import("../modules/workspace/workspace-store");
                  await openWorkspace(r.path);
                }}>
                  <text content={`  ${r.path}`} />
                </box>
              ))}
            </box>
          )}
          {!sec.collapsed && sec.id === "git" && git.isRepo && (
            <box flexDirection="column" paddingLeft={2}>
              <text content={`  Branch: ${git.branch}`} />
              <text content={`  Status: ${git.dirty ? "Dirty" : "Clean"}`} />
              {log.map(c => (
                <text key={c.hash} content={`  ${c.hash.slice(0, 7)} ${c.message}`} />
              ))}
            </box>
          )}
          {!sec.collapsed && sec.id === "quick" && (
            <box flexDirection="column" paddingLeft={2}>
              <text content={"  Ctrl+P  Command Palette"} />
              <text content={"  Ctrl+O  Open folder"} />
            </box>
          )}
        </box>
      ))}
      {!recents.length && !git.isRepo && (
        <text content={" Open a folder to get started (Ctrl+P → 'Open Folder')"} />
      )}
    </box>
  );
}

export function goHome(): void {
  // Used as a palette action — closes all tabs to show dashboard
  const tabs = getTabs().slice();
  for (const t of tabs) closeTab(t.id);
}
