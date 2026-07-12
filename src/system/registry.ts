import { bus } from "./events";

export interface InkModule {
  key: string;
  init(context: ModuleContext): void | Promise<void>;
  destroy?(): void | Promise<void>;
}

export interface ModuleContext {
  registerAction(action: ActionRegistration): void;
}

export interface ActionRegistration {
  id: string;
  label: string;
  category: string;
  keybinding?: string;
  run: () => void;
}

class ModuleRegistry {
  private modules = new Map<string, InkModule>();
  private actions = new Map<string, ActionRegistration>();
  private context: ModuleContext = {
    registerAction: (action) => {
      this.actions.set(action.id, action);
    },
  };

  async register(module: InkModule): Promise<void> {
    if (this.modules.has(module.key)) return;
    this.modules.set(module.key, module);
    await module.init(this.context);
    bus.emit("module:registered", { key: module.key });
  }

  async destroyAll(): Promise<void> {
    for (const mod of this.modules.values()) {
      await mod.destroy?.();
    }
    this.modules.clear();
    this.actions.clear();
  }

  getActions(): ActionRegistration[] {
    return Array.from(this.actions.values());
  }

  getModule(key: string): InkModule | undefined {
    return this.modules.get(key);
  }
}

export const registry = new ModuleRegistry();
