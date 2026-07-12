import { registerAction } from "../palette/store";
import { registerSlashCommand, type SlashCommand } from "../ai/slash";
import { registerKeybinding, type KeyBinding } from "../keybindings/store";

export interface InkPlugin {
  name: string;
  version: string;
  init: (api: InkPluginAPI) => void;
}

export interface InkPluginAPI {
  registerAction: typeof registerAction;
  registerSlashCommand: (cmd: SlashCommand) => void;
  registerKeybinding: (binding: KeyBinding) => void;
  // ponytail: registerPanel, registerExportFormat, registerAIProvider deferred
}

export function createPluginAPI(): InkPluginAPI {
  return {
    registerAction,
    registerSlashCommand,
    registerKeybinding,
  };
}
