/** Clamp long user-visible strings so chips and quotes don’t blow layouts. */
export function truncateMessage(text: string, maxChars: number): string {
  const t = text.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
}
