import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createPluginAPI, type InkPlugin } from "./api";

// ponytail: plugins loaded from workspace .ink/plugins/ directory; npm plugin support deferred
export function loadPlugins(rootPath: string): void {
  const pluginDir = join(rootPath, ".ink", "plugins");
  if (!existsSync(pluginDir)) return;

  const api = createPluginAPI();
  const entries = readdirSync(pluginDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgPath = join(pluginDir, entry.name, "package.json");
    const mainPath = join(pluginDir, entry.name, "index.js");
    if (!existsSync(pkgPath) || !existsSync(mainPath)) continue;

    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const plugin: InkPlugin = { name: pkg.name ?? entry.name, version: pkg.version ?? "0.0.0", init: require(mainPath).default ?? require(mainPath) };
      plugin.init(api);
      console.log(`[plugins] Loaded ${plugin.name} v${plugin.version}`);
    } catch (e) {
      console.error(`[plugins] Failed to load ${entry.name}:`, e);
    }
  }
}

// ponytail: plugin enable/disable/toggle UI deferred
const disabledPlugins = new Set<string>();
export function disablePlugin(name: string): void { disabledPlugins.add(name); }
export function enablePlugin(name: string): void { disabledPlugins.delete(name); }
export function isPluginEnabled(name: string): boolean { return !disabledPlugins.has(name); }
