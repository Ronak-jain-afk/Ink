import { registerAction } from "../palette/store";
import { getSettingsList } from "./panel";

export function registerSettingsActions(): void {
  for (const item of getSettingsList()) {
    if (item.type === "toggle") {
      registerAction({
        id: `settings.toggle.${item.id}`,
        label: `Toggle ${item.label}`,
        category: `Settings: ${item.category}`,
        execute: () => item.set(!item.value()),
      });
    } else if (item.type === "number") {
      registerAction({
        id: `settings.set.${item.id}`,
        label: `Set ${item.label}`,
        category: `Settings: ${item.category}`,
        execute: () => item.set(item.value()), // ponytail: interactive number input deferred
      });
    } else if (item.type === "select") {
      for (const opt of item.options ?? []) {
        registerAction({
          id: `settings.${item.id}.${opt}`,
          label: `Mode: ${opt}`,
          category: "Settings: Workspace",
          execute: () => item.set(opt),
        });
      }
    }
  }
}
