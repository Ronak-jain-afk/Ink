import type { BlockToken } from "./parser";

export interface MermaidBlock {
  code: string;
  lineStart: number;
}

export function extractMermaidBlocks(blocks: BlockToken[]): MermaidBlock[] {
  const result: MermaidBlock[] = [];
  let lineOffset = 0;

  for (const block of blocks) {
    if (block.type === "codeblock" && block.lang === "mermaid") {
      result.push({ code: block.code, lineStart: lineOffset });
    }
    // Rough line counting for offset tracking
    if (block.type === "codeblock") lineOffset += block.code.split("\n").length + 2;
    else if (block.type === "paragraph") lineOffset += 1;
    else if (block.type === "heading") lineOffset += 1;
    else if (block.type === "blockquote") lineOffset += 1;
    else if (block.type === "list") lineOffset += block.items.length;
    else if (block.type === "tasklist") lineOffset += block.items.length;
    else if (block.type === "hr") lineOffset += 1;
    else if (block.type === "table") lineOffset += 2 + block.rows.length;
  }

  return result;
}

export function renderMermaidBlock(code: string): string {
  // ponytail: ASCII box-drawing fallback. Full rendering requires an engine.
  const lines = code.split("\n");
  const width = Math.min(40, Math.max(...lines.map(l => l.length), 8));
  const top = `┌${"─".repeat(width)}┐`;
  const bottom = `└${"─".repeat(width)}┘`;
  const body = lines.map(l => `│ ${l.padEnd(width)}│`).join("\n");
  return `${top}\n${body}\n${bottom}`;
}
