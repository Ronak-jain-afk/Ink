import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ponytail: file-based storage. OS keychain integration deferred.
const CRED_FILE = ".ink/credentials.json";

function credPath(rootPath: string): string {
  return join(rootPath, CRED_FILE);
}

export function saveCredentials(rootPath: string, creds: Record<string, string>): void {
  try {
    const dir = join(rootPath, ".ink");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(credPath(rootPath), JSON.stringify(creds), { encoding: "utf-8", mode: 0o600 });
  } catch { /* skip */ }
}

export function loadCredentials(rootPath: string): Record<string, string> {
  try {
    const path = credPath(rootPath);
    if (!existsSync(path)) return {};
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}
