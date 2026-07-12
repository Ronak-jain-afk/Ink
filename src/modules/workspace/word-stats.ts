export function getWordStats(text: string): { words: number; chars: number; readingTime: number } {
  const trimmed = text.trim();
  if (!trimmed) return { words: 0, chars: 0, readingTime: 0 };
  const words = trimmed.split(/\s+/).length;
  const chars = trimmed.length;
  const readingTime = Math.max(1, Math.round(words / 200));
  return { words, chars, readingTime };
}
