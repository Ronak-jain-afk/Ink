import { useState } from "react";
import { getWorkspaceState, getRelativePath, type FileNode } from "../modules/workspace/workspace-store";
import { getRecentProjects } from "../modules/workspace/recent";
import { openFileInEditor } from "../shell/App";
import { statusGlyph, type GitFileStatus } from "../modules/git/status-badges";

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  fileStatuses: Map<string, GitFileStatus>;
}

function TreeNode({ node, depth, fileStatuses }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(node.expanded ?? false);
  const indent = "\u00A0".repeat(Math.max(0, depth * 2));

  if (node.isDirectory) {
    return (
      <>
        <box height={1} onMouseDown={() => setExpanded(!expanded)}>
          <text content={`${indent}${expanded ? "▼" : "▶"} ${node.name}/`} />
        </box>
        {expanded && node.children?.map(child => (
          <TreeNode key={child.path} node={child} depth={depth + 1} fileStatuses={fileStatuses} />
        ))}
      </>
    );
  }

  const rel = getRelativePath(node.path);
  const status = fileStatuses.get(rel);
  const badge = status ? statusGlyph(status) : "";

  return (
    <box height={1} onMouseDown={() => openFileInEditor(node.path)}>
      <text content={`${indent} ${badge} ${node.name}`} />
    </box>
  );
}

export function FileExplorer({ rev }: { rev: number }) {
  const ws = getWorkspaceState();
  const multi = getMultiRoots();

  const allTrees: { name: string; children: FileNode[] | undefined }[] = multi.roots.length > 0
    ? [{ name: ws.rootPath ?? "(root)", children: ws.tree?.children }, ...multi.roots.map((r, i) => ({ name: r, children: multi.trees[i]?.children }))]
    : [];

  return (
    <box flexDirection="column" paddingLeft={1}>
      <text content={" EXPLORER"} />
      {!ws.rootPath || !ws.tree ? (
        <RecentList />
      ) : multi.roots.length > 0 ? (
        allTrees.map(t => (
          <TreeNode key={t.name} node={{ name: t.name, path: t.name, isDirectory: true, children: t.children, expanded: true }} depth={0} fileStatuses={ws.fileStatuses} />
        ))
      ) : (
        ws.tree.children?.map(child => (
          <TreeNode key={child.path} node={child} depth={0} fileStatuses={ws.fileStatuses} />
        ))
      )}
    </box>
  );
}

import { getMultiRoots } from "../modules/workspace/multiroot";

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
