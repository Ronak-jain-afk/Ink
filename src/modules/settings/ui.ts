import { registerAction } from "../palette/store";
import { getWorkspaceState } from "../workspace/workspace-store";
import { loadSettings, saveSettings } from "../workspace/settings";
import { bus } from "../../system/events";

export function registerSettingsActions(): void {
  const toggle = (key: "showHidden" | "wordWrap", label: string) => {
    registerAction({
      id: `settings.toggle.${key}`,
      label: `Toggle ${label}`,
      category: "Settings",
      execute: () => {
        const ws = getWorkspaceState();
        if (!ws.rootPath) return;
        const settings = loadSettings(ws.rootPath);
        saveSettings(ws.rootPath, { ...settings, [key]: !settings[key] });
        bus.emit("git:status-changed", {});
      },
    });
  };

  toggle("showHidden", "Show Hidden Files");
  toggle("wordWrap", "Word Wrap");
}
