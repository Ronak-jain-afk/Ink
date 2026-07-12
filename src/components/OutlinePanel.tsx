import { parseMarkdown, type BlockToken } from "../modules/preview/parser";

export interface HeadingEntry {
  level: number;
  text: string;
  lineOffset: number;
}

function extractHeadings(blocks: BlockToken[], baseOffset: number): HeadingEntry[] {
  const entries: HeadingEntry[] = [];
  let offset = baseOffset;

  for (const block of blocks) {
    if (block.type === "heading") {
      entries.push({
        level: block.level,
        text: block.children.map(t => t.text).join(""),
        lineOffset: offset,
      });
      offset += 1;
    } else {
      offset += blockToLines(block);
    }
  }

  return entries;
}

function blockToLines(block: BlockToken): number {
  switch (block.type) {
    case "paragraph": return 1;
    case "codeblock": return block.code.split("\n").length + 2;
    case "blockquote": return 1;
    case "list": return block.items.length;
    case "tasklist": return block.items.length;
    case "hr": return 1;
    case "table": return 2 + block.rows.length;
    default: return 1;
  }
}

export function getOutline(text: string): HeadingEntry[] {
  const blocks = parseMarkdown(text);
  return extractHeadings(blocks, 0);
}

export function OutlinePanel({ editorText }: { editorText: string }) {
  if (!editorText) return null;

  const headings = getOutline(editorText);

  if (headings.length === 0) return null;

  return (
    <>
      {headings.map((h, i) => (
        <text key={i} content={"  ".repeat(h.level - 1) + h.text} />
      ))}
    </>
  );
}
