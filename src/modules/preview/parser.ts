export type InlineToken =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; url: string }
  | { type: "strikethrough"; text: string };

export type BlockToken =
  | { type: "heading"; level: number; children: InlineToken[] }
  | { type: "paragraph"; children: InlineToken[] }
  | { type: "codeblock"; lang: string; code: string }
  | { type: "blockquote"; children: BlockToken[] }
  | { type: "list"; ordered: boolean; items: { children: InlineToken[] }[] }
  | { type: "tasklist"; items: { checked: boolean; children: InlineToken[] }[] }
  | { type: "hr" }
  | { type: "table"; header: InlineToken[][]; rows: InlineToken[][][] };

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;
  while (i < text.length) {
    if (text.startsWith("**", i)) {
      const end = text.indexOf("**", i + 2);
      if (end !== -1) {
        tokens.push({ type: "bold", text: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    if (text.startsWith("*", i) || text.startsWith("_", i)) {
      const ch = text[i]!;
      const end = text.indexOf(ch, i + 1);
      if (end !== -1 && !text.startsWith("**", i)) {
        tokens.push({ type: "italic", text: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (text.startsWith("`", i)) {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        tokens.push({ type: "code", text: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (text.startsWith("~~", i)) {
      const end = text.indexOf("~~", i + 2);
      if (end !== -1) {
        tokens.push({ type: "strikethrough", text: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    if (text.startsWith("[", i)) {
      const closeB = text.indexOf("](", i);
      if (closeB !== -1) {
        const closeP = text.indexOf(")", closeB + 2);
        if (closeP !== -1) {
          tokens.push({ type: "link", text: text.slice(i + 1, closeB), url: text.slice(closeB + 2, closeP) });
          i = closeP + 1;
          continue;
        }
      }
    }
    tokens.push({ type: "text", text: text[i]! });
    i++;
  }
  return tokens;
}

export function parseMarkdown(md: string): BlockToken[] {
  const lines = md.split("\n");
  const blocks: BlockToken[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // Heading
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      blocks.push({ type: "heading", level: hMatch[1]!.length, children: parseInline(hMatch[2]!) });
      i++;
      continue;
    }

    // HR
    if (/^---+$/.test(line) || /^\*+$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: "codeblock", lang, code: codeLines.join("\n") });
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i]!.startsWith(">")) {
        quoteLines.push(lines[i]!.replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", children: parseMarkdown(quoteLines.join("\n")) });
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && /^[\s|:-]+$/.test(lines[i + 1]!)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i]!.includes("|")) {
        tableLines.push(lines[i]!);
        i++;
      }
      const header = tableLines[0]!.split("|").map(c => parseInline(c.trim()));
      const rows = tableLines.slice(2).map(r => r.split("|").map(c => parseInline(c.trim())));
      blocks.push({ type: "table", header, rows });
      continue;
    }

    // Task list
    const taskMatch = line.match(/^\s*[-*+]\s+\[([ x])\]\s+(.+)$/);
    if (taskMatch) {
      const items: { checked: boolean; children: InlineToken[] }[] = [];
      while (i < lines.length) {
        const m = lines[i]!.match(/^\s*[-*+]\s+\[([ x])\]\s+(.+)$/);
        if (!m) break;
        items.push({ checked: m[1] === "x", children: parseInline(m[2]!) });
        i++;
      }
      blocks.push({ type: "tasklist", items });
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^\s*[-*+]\s+(.+)$/);
    if (ulMatch) {
      const items: { children: InlineToken[] }[] = [];
      while (i < lines.length) {
        const m = lines[i]!.match(/^\s*[-*+]\s+(.+)$/);
        if (!m) break;
        items.push({ children: parseInline(m[1]!) });
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (olMatch) {
      const items: { children: InlineToken[] }[] = [];
      while (i < lines.length) {
        const m = lines[i]!.match(/^\s*\d+\.\s+(.+)$/);
        if (!m) break;
        items.push({ children: parseInline(m[1]!) });
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Paragraph (collect consecutive non-empty lines until next block)
    if (line.trim()) {
      const paraLines: string[] = [];
      while (i < lines.length && lines[i]!.trim() && !lines[i]!.match(/^(#{1,6}|```|>|---|\*+|\d+\.|-)/)) {
        paraLines.push(lines[i]!.trim());
        i++;
      }
      blocks.push({ type: "paragraph", children: parseInline(paraLines.join(" ")) });
      continue;
    }
    i++;
  }

  return blocks;
}
