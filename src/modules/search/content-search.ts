import { readFileContent } from "../workspace/file-system";
import { getAllFiles } from "../workspace/workspace-store";

export interface ContentMatch {
  filePath: string;
  fileName: string;
  line: number;
  content: string;
}

export async function searchContent(query: string): Promise<ContentMatch[]> {
  const q = query.toLowerCase();
  const files = getAllFiles();
  const results: ContentMatch[] = [];

  for (const file of files) {
    try {
      const { text } = await readFileContent(file.path);
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]!.toLowerCase().includes(q)) {
          results.push({
            filePath: file.path,
            fileName: file.name,
            line: i + 1,
            content: lines[i]!.trim(),
          });
        }
      }
      if (results.length >= 100) break;
    } catch {
      // skip unreadable files
    }
  }

  return results;
}
