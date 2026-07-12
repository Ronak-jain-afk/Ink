import { getRecentProjects } from "../modules/workspace/recent";

export function Dashboard() {
  const recents = getRecentProjects();

  return (
    <box flexGrow={1} flexDirection="column" alignItems="center" justifyContent="center">
      <text content={" Ink — Markdown Workspace"} />
      {recents.length > 0 && (
        <>
          <text content={" Recent projects:"} />
          {recents.map(r => (
            <text key={r.path} content={`  ${r.path}`} />
          ))}
        </>
      )}
      <text content={""} />
      <text content={" Ctrl+P  Command Palette"} />
      <text content={" Ctrl+O  Open folder"} />
    </box>
  );
}
