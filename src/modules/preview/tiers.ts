export type RenderTier = "full" | "reduced" | "minimal";

let currentTier: RenderTier = "reduced";

export function detectTier(caps: { trueColor: boolean; unicode: boolean }): RenderTier {
  if (caps.trueColor && caps.unicode) {
    currentTier = "full";
  } else if (caps.unicode) {
    currentTier = "reduced";
  } else {
    currentTier = "minimal";
  }
  return currentTier;
}

export function getTier(): RenderTier {
  return currentTier;
}
