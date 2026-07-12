import { useState } from "react";
import { getWorkspaceState, type FileNode } from "../modules/workspace/workspace-store";
import { getRecentProjects } from "../modules/workspace/recent";
import { openFileInEditor } from "../shell/App";

interface TreeNodeProps {
  node: FileNode;
  depth: number;
}

function TreeNode({ node, depth }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(node.expanded ?? false);
  const indent = "\u00A0".repeat(Math.max(0, depth * 2));

  if (node.isDirectory) {
    return (
      <>
        <box height={1} onMouseDown={() => setExpanded(!expanded)}>
          <text content={`${indent}${expanded ? "▼" : "▶"} ${node.name}/`} />
        </box>
        {expanded && node.children?.map(child => (
          <TreeNode key={child.path} node={child} depth={depth + 1} />
        ))}
      </>
    );
  }

  return (
    <box height={1} onMouseDown={() => openFileInEditor(node.path)}>
      <text content={`${indent} ${node.name}`} />
    </box>
  );
}

export function FileExplorer({ rev }: { rev: number }) {
  const ws = getWorkspaceState();

  return (
    <box width={30} flexDirection="column" paddingLeft={1}>
      <text content={" EXPLORER"} />
      {!ws.rootPath || !ws.tree ? (
        <RecentList />
      ) : (
        ws.tree.children?.map(child => (
          <TreeNode key={child.path} node={child} depth={0} />
        ))
      )}
    </box>
  );
}

function RecentList() {
  const recents = getRecentProjects();
  return (
    <>
      <text content={" (no folder open)"} />
      {recents.length > 0 && (
        <>
          <text content={" Recent projects:"} />
          {recents.map(r => (
            <box key={r.path} height={1} onMouseDown={async () => {
              const { openWorkspace } = await import("../modules/workspace/workspace-store");
              await openWorkspace(r.path);
            }}>
              <text content={` ${r.path}`} />
            </box>
          ))}
        </>
      )}
    </>
  );
}

export async function pickAndOpenFolder(): Promise<void> {
  const cwd = process.cwd();
  const { openWorkspace } = await import("../modules/workspace/workspace-store");
  await openWorkspace(cwd);
}
