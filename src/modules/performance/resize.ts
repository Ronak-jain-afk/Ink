import { bus } from "../../system/events";

const MIN_WIDTH = 60;
const MIN_HEIGHT = 20;

export function getMinDimensions() {
  return { width: MIN_WIDTH, height: MIN_HEIGHT };
}

export function checkDimensions(cols: number, rows: number): boolean {
  if (cols < MIN_WIDTH || rows < MIN_HEIGHT) {
    console.warn(`[ink] Terminal too small: ${cols}x${rows} (min ${MIN_WIDTH}x${MIN_HEIGHT})`);
    return false;
  }
  return true;
}
