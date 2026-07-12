import { getWorkspaceState } from "../workspace/workspace-store";
import { detectGit } from "./detect";
import { getFileStatuses } from "./status-badges";
import { bus } from "../../system/events";

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startGitPolling(intervalMs = 5000): void {
  stopGitPolling();
  intervalId = setInterval(() => {
    const ws = getWorkspaceState();
    if (!ws.rootPath) return;
    detectGit(ws.rootPath);
    ws.fileStatuses = getFileStatuses(ws.rootPath);
    bus.emit("git:status-changed", {});
  }, intervalMs);
}

export function stopGitPolling(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
