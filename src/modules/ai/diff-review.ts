import { writeFileSync } from "node:fs";

export interface ProposedEdit {
  filePath: string;
  original: string;
  replacement: string;
  accepted: boolean;
}

let pendingEdits: ProposedEdit[] = [];

export function setProposedEdits(edits: ProposedEdit[]): void {
  pendingEdits = edits;
}

export function getPendingEdits(): ProposedEdit[] {
  return pendingEdits;
}

export function acceptEdit(index: number): void {
  const edit = pendingEdits[index];
  if (!edit || edit.accepted) return;
  edit.accepted = true;
  writeFileSync(edit.filePath, edit.replacement, "utf-8");
}

export function rejectEdit(index: number): void {
  const edit = pendingEdits[index];
  if (!edit) return;
  pendingEdits.splice(index, 1);
}

export function acceptAll(): void {
  for (let i = pendingEdits.length - 1; i >= 0; i--) {
    acceptEdit(i);
  }
  pendingEdits = [];
}

export function rejectAll(): void {
  pendingEdits = [];
}
