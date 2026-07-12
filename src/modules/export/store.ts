import { writeFileSync } from "node:fs";
import { parseMarkdown } from "../preview/parser";

// ponytail: HTML export only; PDF via OS print. Full Pandoc/LaTeX integration deferred.
export function exportHTML(markdown: string, outputPath: string): void {
  const body = renderHTMLBody(parseMarkdown(markdown));
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
code { background: #f5f5f5; padding: 0.1em 0.3em; }
img { max-width: 100%; }
blockquote { border-left: 3px solid #ccc; margin: 0; padding-left: 1rem; color: #666; }
</style></head><body>${body}</body></html>`;
  writeFileSync(outputPath, html, "utf-8");
}

function renderHTMLBody(tokens: any[]): string {
  return tokens.map(t => {
    switch (t.type) {
      case "heading": return `<h${t.level}>${escapeHTML(t.text)}</h${t.level}>`;
      case "paragraph": return `<p>${inlineHTML(t.children)}</p>`;
      case "code_block": return `<pre><code>${escapeHTML(t.text)}</code></pre>`;
      case "code_inline": return `<code>${escapeHTML(t.text)}</code>`;
      case "list": {
        const tag = t.ordered ? "ol" : "ul";
        return `<${tag}>${t.items.map((i: any) => `<li>${inlineHTML(i.children || [{ type: "text", text: i.text }])}</li>`).join("")}</${tag}>`;
      }
      case "blockquote": return `<blockquote>${renderHTMLBody(t.children)}</blockquote>`;
      case "hr": return "<hr>";
      case "image": return `<img src="${escapeHTML(t.url)}" alt="${escapeHTML(t.alt || "")}" />`;
      case "link": return `<a href="${escapeHTML(t.url)}">${escapeHTML(t.text)}</a>`;
      case "text": return escapeHTML(t.text);
      case "strong": return `<strong>${escapeHTML(t.text)}</strong>`;
      case "emphasis": return `<em>${escapeHTML(t.text)}</em>`;
      default: return escapeHTML(t.text || "");
    }
  }).join("\n");
}

function inlineHTML(children: any[]): string {
  return children.map((c: any) => {
    if (typeof c === "string") return escapeHTML(c);
    switch (c.type) {
      case "text": return escapeHTML(c.text);
      case "strong": return `<strong>${escapeHTML(c.text)}</strong>`;
      case "emphasis": return `<em>${escapeHTML(c.text)}</em>`;
      case "code_inline": return `<code>${escapeHTML(c.text)}</code>`;
      case "link": return `<a href="${escapeHTML(c.url)}">${escapeHTML(c.text)}</a>`;
      case "image": return `<img src="${escapeHTML(c.url)}" alt="${escapeHTML(c.alt || "")}" />`;
      default: return escapeHTML(c.text || "");
    }
  }).join("");
}

function escapeHTML(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
