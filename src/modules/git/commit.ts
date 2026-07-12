import { execSync } from "node:child_process";

let subject = "";
let body = "";

export function setSubject(s: string): void { subject = s; }
export function setBody(b: string): void { body = b; }
export function getSubject(): string { return subject; }
export function getBody(): string { return body; }

export function commit(rootPath: string): boolean {
  try {
    const msg = body ? `${subject}\n\n${body}` : subject;
    execSync(`git commit -m "${msg}"`, { cwd: rootPath, encoding: "utf-8" });
    subject = "";
    body = "";
    return true;
  } catch {
    return false;
  }
}
