export interface CursorPosition {
  line: number;
  col: number;
  scroll: number;
}

const positions = new Map<string, CursorPosition>();

export function setCursor(filePath: string, pos: CursorPosition): void {
  positions.set(filePath, pos);
}

export function getCursor(filePath: string): CursorPosition | undefined {
  return positions.get(filePath);
}

export function clearCursor(filePath: string): void {
  positions.delete(filePath);
}
