import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { parseMarkdown } from "../preview/parser";
import { getAllFiles } from "../workspace/workspace-store";
import { bus } from "../../system/events";

// ponytail: progress via events; no progress bar UI yet
let exportAbort = false;
export function cancelExport(): void { exportAbort = true; }
export function resetExportCancel(): void { exportAbort = false; }

const IGNORE_PATTERNS = [".git", "node_modules", ".ink"];
export function setIgnorePatterns(patterns: string[]): void {
  IGNORE_PATTERNS.length = 0;
  IGNORE_PATTERNS.push(...patterns);
}

function shouldIgnore(p: string): boolean {
  return IGNORE_PATTERNS.some(pat => p.includes(pat));
}

// ponytail: HTML export only; PDF via OS print. Full Pandoc/LaTeX integration deferred.
export function exportMarkdown(markdown: string, outputPath: string): void {
  const normalized = markdown
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim() + "\n";
  writeFileSync(outputPath, normalized, "utf-8");
}

export function exportPreview(markdown: string): string {
  const tokens = parseMarkdown(markdown);
  const headingCount = tokens.filter((t: any) => t.type === "heading").length;
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const charCount = markdown.length;
  const outputSize = Math.round(wordCount * 0.02) + "KB";
  return `${headingCount} headings, ${wordCount} words, ${charCount} chars, ~${outputSize} HTML`;
}

export function exportHTML(markdown: string, outputPath: string): void {
  const body = renderHTMLBody(parseMarkdown(markdown));
  const styles = `body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
code { background: #f5f5f5; padding: 0.1em 0.3em; }
img { max-width: 100%; }
blockquote { border-left: 3px solid #ccc; margin: 0; padding-left: 1rem; color: #666; }`;
  writeFileSync(outputPath, html5(styles, body), "utf-8");
}

function html5(styles: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${styles}</style></head><body>${body}</body></html>`;
}

// ponytail: PDF via HTML-to-PRINT; real PDF generation deferred
export function exportPDF(markdown: string, outputPath: string): void {
  const body = renderHTMLBody(parseMarkdown(markdown));
  const styles = `body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 0 auto; padding: 0; line-height: 1.6; }
@media print { @page { margin: 1in; } }
pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; page-break-inside: avoid; }
code { background: #f5f5f5; padding: 0.1em 0.3em; }
img { max-width: 100%; }
blockquote { border-left: 3px solid #ccc; margin: 0; padding-left: 1rem; color: #666; }
h1, h2, h3 { page-break-after: avoid; }`;
  writeFileSync(outputPath.replace(/\.pdf$/, ".html"), html5(styles, body), "utf-8");
  // ponytail: converts to PDF via browser print; open .html and Print→Save as PDF
}

// ponytail: static site — each .md becomes .html, linked via relative paths
export function exportStaticSite(rootPath: string, outputDir: string): void {
  const files = getAllFiles().filter(f => f.name.endsWith(".md") && !shouldIgnore(f.path));
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  for (const file of files) {
    try {
      const text = readFileSync(file.path, "utf-8");
      const body = renderHTMLBody(parseMarkdown(text));
      const rel = relative(rootPath, file.path).replace(/\.md$/, ".html");
      const outPath = join(outputDir, rel);
      mkdirSync(outPath.split("/").slice(0, -1).join("/") || ".", { recursive: true });
      const nav = files.map(f => {
        const frel = relative(rootPath, f.path).replace(/\.md$/, ".html");
        const active = f.path === file.path ? " (current)" : "";
        return `<a href="${frel}">${f.name}${active}</a>`;
      }).join(" | ");
      writeFileSync(outPath, html5(`body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
nav { margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #ccc; }
nav a { margin-right: 0.5rem; }`, `<nav>${nav}</nav>${body}`), "utf-8");
    } catch { /* skip */ }
  }
}

export function exportArchive(rootPath: string, outputPath: string): void {
  // ponytail: creates a tar-like concatenation; full tar/zip deferred
  const files = getAllFiles().filter(f => !shouldIgnore(f.path));
  const parts = files.map(f => {
    try {
      const text = readFileSync(f.path, "utf-8");
      return `=== ${relative(rootPath, f.path)} ===\n${text}`;
    } catch { return ""; }
  }).filter(Boolean);
  writeFileSync(outputPath, parts.join("\n\n"), "utf-8");
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
