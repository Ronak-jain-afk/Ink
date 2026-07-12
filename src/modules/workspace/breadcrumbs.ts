import { getWorkspaceState, getRelativePath } from "./workspace-store";

export function getBreadcrumbs(filePath: string | null | undefined): string {
  if (!filePath) return "";
  const ws = getWorkspaceState();
  if (!ws.rootPath) return filePath;
  const rel = getRelativePath(filePath);
  const parts = rel.split("/");
  const dirs = parts.slice(0, -1);
  const filename = parts[parts.length - 1] ?? "";
  return dirs.length ? `${ws.rootPath} / ${dirs.join(" / ")} / ${filename}` : filename;
}
