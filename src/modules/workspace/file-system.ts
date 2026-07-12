import { readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";

export type LineEnding = "LF" | "CRLF";

export interface FileMetadata {
  path: string;
  size: number;
  encoding: "UTF-8" | "UTF-16" | "binary";
  lineEnding: LineEnding;
  isLarge: boolean;
}

export interface FileContent {
  metadata: FileMetadata;
  text: string;
}

const LARGE_FILE_THRESHOLD = 1024 * 1024; // 1 MB

function detectLineEnding(buffer: Buffer): LineEnding {
  const crlf = buffer.indexOf("\r\n");
  const lf = buffer.indexOf("\n", crlf === -1 ? 0 : crlf + 1);
  if (crlf !== -1 && (lf === -1 || crlf < lf)) return "CRLF";
  return "LF";
}

function detectEncoding(buffer: Buffer): "UTF-8" | "UTF-16" | "binary" {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return "UTF-16";
  if (buffer[0] === 0xfe && buffer[1] === 0xff) return "UTF-16";
  if (buffer.indexOf(0x00) !== -1 && buffer.indexOf(0x00) % 2 === 1) return "binary";
  return "UTF-8";
}

export async function readFileContent(filePath: string): Promise<FileContent> {
  const fileStat = await stat(filePath);
  const isLarge = fileStat.size > LARGE_FILE_THRESHOLD;
  const buffer = await readFile(filePath);
  const encoding = detectEncoding(buffer);
  const lineEnding = detectLineEnding(buffer);

  let text: string;
  if (encoding === "UTF-8") {
    text = buffer.toString("utf-8");
  } else if (encoding === "UTF-16") {
    text = buffer.toString("utf-16le");
  } else {
    text = buffer.toString("utf-8");
  }

  return {
    metadata: { path: filePath, size: fileStat.size, encoding, lineEnding, isLarge },
    text,
  };
}

export async function writeFileContent(
  filePath: string,
  text: string,
  lineEnding: LineEnding = "LF",
): Promise<void> {
  const normalized = lineEnding === "CRLF" ? text.replace(/\n/g, "\r\n") : text.replace(/\r\n/g, "\n");
  await writeFile(filePath, normalized, "utf-8");
}

export function exists(filePath: string): boolean {
  return existsSync(filePath);
}
