import { useState } from "react";
import { getWorkspaceState, type FileNode } from "../modules/workspace/workspace-store";
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
          <TreeNode node={child} depth={depth + 1} />
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

const fileTreeKey: unique symbol = Symbol();

export function FileExplorer({ rev }: { rev: number }) {
  const ws = getWorkspaceState();

  return (
    <box width={30} flexDirection="column" paddingLeft={1}>
      <text content={" EXPLORER"} />
      {!ws.rootPath || !ws.tree ? (
        <text content={" (no folder open)"} />
      ) : (
        ws.tree.children?.map((child, i) => (
          <TreeNode key={String(i)} node={child} depth={0} />
        ))
      )}
    </box>
  );
}

export async function pickAndOpenFolder(): Promise<void> {
  const cwd = process.cwd();
  const { openWorkspace } = await import("../modules/workspace/workspace-store");
  await openWorkspace(cwd);
}
