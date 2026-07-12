import { getAllFiles } from "../workspace/workspace-store";
import { readFileContent } from "../workspace/file-system";
import type { ContentMatch } from "./content-search";

export interface HeadingMatch {
  filePath: string;
  level: number;
  text: string;
  line: number;
}

export interface SymbolMatch {
  filePath: string;
  name: string;
  type: "frontmatter" | "anchor" | "tag";
  line: number;
}

export async function searchHeadings(query: string): Promise<HeadingMatch[]> {
  const q = query.toLowerCase();
  const files = getAllFiles();
  const results: HeadingMatch[] = [];

  for (const file of files) {
    if (!file.name.endsWith(".md")) continue;
    try {
      const { text } = await readFileContent(file.path);
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i]!.match(/^(#{1,6})\s+(.+)/);
        if (m && (!q || m[2]!.toLowerCase().includes(q))) {
          results.push({ filePath: file.path, level: m[1]!.length, text: m[2]!, line: i + 1 });
        }
      }
      if (results.length >= 100) break;
    } catch { /* skip */ }
  }
  return results;
}

export async function searchSymbols(query: string): Promise<SymbolMatch[]> {
  const q = query.toLowerCase();
  const files = getAllFiles();
  const results: SymbolMatch[] = [];

  for (const file of files) {
    if (!file.name.endsWith(".md")) continue;
    try {
      const { text } = await readFileContent(file.path);
      const lines = text.split("\n");
      let inFrontmatter = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (i === 0 && line.trim() === "---") { inFrontmatter = true; continue; }
        if (inFrontmatter && line.trim() === "---") { inFrontmatter = false; continue; }
        if (inFrontmatter) {
          const fm = line.match(/^(\w+):\s*(.+)/);
          if (fm && (!q || fm[1]!.toLowerCase().includes(q) || fm[2]!.toLowerCase().includes(q))) {
            results.push({ filePath: file.path, name: `${fm[1]}: ${fm[2]}`, type: "frontmatter", line: i + 1 });
          }
        }
        const anchor = line.match(/\{#[a-zA-Z0-9_-]+\}/);
        if (anchor && (!q || anchor[0]!.toLowerCase().includes(q))) {
          results.push({ filePath: file.path, name: anchor[0], type: "anchor", line: i + 1 });
        }
        const tag = line.match(/#([a-zA-Z0-9_-]+)/g);
        if (tag) for (const t of tag) {
          if (!q || t.toLowerCase().includes(q)) results.push({ filePath: file.path, name: t, type: "tag", line: i + 1 });
        }
      }
      if (results.length >= 100) break;
    } catch { /* skip */ }
  }
  return results;
}

export async function regexSearch(pattern: string): Promise<ContentMatch[]> {
  let regex: RegExp;
  try { regex = new RegExp(pattern, "gi"); } catch { return []; }
  const files = getAllFiles();
  const results: ContentMatch[] = [];

  for (const file of files) {
    try {
      const { text } = await readFileContent(file.path);
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i]!)) {
          results.push({ filePath: file.path, fileName: file.name, line: i + 1, content: lines[i]!.trim() });
        }
      }
      if (results.length >= 100) break;
    } catch { /* skip */ }
  }
  return results;
}
