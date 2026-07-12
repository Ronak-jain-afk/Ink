export interface SearchResult {
  path: string;
  name: string;
  score: number;
}

// ponytail: simple prefix + substring match. Fuse.js for real fuzzy if needed.
function score(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 50;
  return 0;
}

export function fuzzySearchFiles(query: string, files: { path: string; name: string }[]): SearchResult[] {
  if (!query.trim()) return [];
  return files
    .map(f => ({ ...f, score: score(query, f.name) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}
