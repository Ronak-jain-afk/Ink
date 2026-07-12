import { readFileContent, writeFileContent } from "../workspace/file-system";
import { getAllFiles } from "../workspace/workspace-store";

export interface ContentMatch {
  filePath: string;
  fileName: string;
  line: number;
  content: string;
}

export interface SearchFilter {
  includeExt?: string[];
  excludePaths?: string[];
  maxResults?: number;
}

const searchHistory: string[] = [];
const MAX_HISTORY = 50;

export function addToHistory(query: string): void {
  const idx = searchHistory.indexOf(query);
  if (idx !== -1) searchHistory.splice(idx, 1);
  searchHistory.unshift(query);
  if (searchHistory.length > MAX_HISTORY) searchHistory.pop();
}

export function getSearchHistory(): string[] {
  return [...searchHistory];
}

export async function searchContent(query: string, filter?: SearchFilter, abort?: AbortSignal): Promise<ContentMatch[]> {
  const q = query.toLowerCase();
  const files = getAllFiles();
  const results: ContentMatch[] = [];
  const maxResults = filter?.maxResults ?? 100;

  for (const file of files) {
    if (abort?.aborted) break;
    if (filter?.excludePaths?.some(p => file.path.includes(p))) continue;
    if (filter?.includeExt && !filter.includeExt.some(e => file.path.endsWith(e))) continue;
    try {
      const { text } = await readFileContent(file.path);
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (abort?.aborted) break;
        if (lines[i]!.toLowerCase().includes(q)) {
          results.push({
            filePath: file.path,
            fileName: file.name,
            line: i + 1,
            content: lines[i]!.trim(),
          });
        }
      }
      if (results.length >= maxResults) break;
    } catch { /* skip */ }
  }

  addToHistory(query);
  return results;
}

export async function searchReplace(query: string, replacement: string, filter?: SearchFilter): Promise<number> {
  const matches = await searchContent(query, filter);
  let count = 0;
  const done = new Set<string>();
  for (const m of matches) {
    if (done.has(m.filePath)) continue;
    done.add(m.filePath);
    try {
      const { text } = await readFileContent(m.filePath);
      const replaced = text.replace(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), replacement);
      if (replaced !== text) {
        await writeFileContent(m.filePath, replaced);
        count++;
      }
    } catch { /* skip */ }
  }
  return count;
}

// ponytail: background indexing runs on workspace open; no incremental yet
let indexCache: Map<string, ContentMatch[]> | null = null;
let indexing = false;

export function isIndexing(): boolean { return indexing; }

export async function buildIndex(): Promise<void> {
  indexing = true;
  indexCache = new Map();
  const files = getAllFiles();
  for (const file of files) {
    try {
      const { text } = await readFileContent(file.path);
      const lines = text.split("\n");
      const matches: ContentMatch[] = [];
      for (let i = 0; i < lines.length; i++) {
        matches.push({ filePath: file.path, fileName: file.name, line: i + 1, content: lines[i]!.trim() });
      }
      indexCache.set(file.path, matches);
    } catch { /* skip */ }
  }
  indexing = false;
}

export function getCachedIndex(): Map<string, ContentMatch[]> | null {
  return indexCache;
}
