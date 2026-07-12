import type { BlockToken, InlineToken } from "./parser";

function renderInlinePlain(token: InlineToken): string {
  switch (token.type) {
    case "text": return token.text;
    case "bold": return token.text;
    case "italic": return token.text;
    case "code": return token.text;
    case "strikethrough": return token.text;
    case "link": return `${token.text} (${token.url})`;
  }
}

function renderBlockPlain(token: BlockToken): string {
  switch (token.type) {
    case "heading":
      return `#${"#".repeat(Math.max(0, token.level - 1))} ${token.children.map(renderInlinePlain).join("")}`;
    case "paragraph":
      return token.children.map(renderInlinePlain).join("");
    case "codeblock":
      return `[code:${token.lang}]\n${token.code}`;
    case "blockquote":
      return token.children.map(renderBlockPlain).join("\n").split("\n").map(l => `> ${l}`).join("\n");
    case "list":
      return token.items.map((item, i) => {
        const bullet = token.ordered ? `${i + 1}.` : "-";
        return ` ${bullet} ${item.children.map(renderInlinePlain).join("")}`;
      }).join("\n");
    case "tasklist":
      return token.items.map(item => {
        const check = item.checked ? "[x]" : "[ ]";
        return ` ${check} ${item.children.map(renderInlinePlain).join("")}`;
      }).join("\n");
    case "hr":
      return "---";
    case "table": {
      const renderRow = (tokens: InlineToken[]) => tokens.map(renderInlinePlain).join("");
      const hdr = token.header.map(c => renderRow(c)).join(" | ");
      const sep = token.header.map(() => "---").join("-+-");
      const rows = token.rows.map(row => row.map(cell => renderRow(cell)).join(" | "));
      return `${hdr}\n${sep}\n${rows.join("\n")}`;
    }
  }
}

export function renderPreview(blocks: BlockToken[]): string {
  return blocks.map(renderBlockPlain).join("\n\n");
}
