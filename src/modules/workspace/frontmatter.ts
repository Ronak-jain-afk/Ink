export interface FrontmatterResult {
  hasFrontmatter: boolean;
  bodyStart: number; // line index where body starts (0-based)
  raw: string;
}

export function detectFrontmatter(text: string): FrontmatterResult {
  const lines = text.split("\n");
  if (lines.length < 3) return { hasFrontmatter: false, bodyStart: 0, raw: "" };
  // First line must be exactly "---"
  if (lines[0]?.trim() !== "---") return { hasFrontmatter: false, bodyStart: 0, raw: "" };
  // Find closing "---"
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === "---") {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) return { hasFrontmatter: false, bodyStart: 0, raw: "" };
  return {
    hasFrontmatter: true,
    bodyStart: endIdx + 1,
    raw: lines.slice(0, endIdx + 1).join("\n"),
  };
}

export function getDisplayText(text: string, collapseFrontmatter: boolean): string {
  const fm = detectFrontmatter(text);
  if (!fm.hasFrontmatter || !collapseFrontmatter) return text;
  const lines = text.split("\n");
  const body = lines.slice(fm.bodyStart).join("\n");
  return `[--- frontmatter: ${fm.raw.split("\n").length - 2} keys ---]\n${body}`;
}
