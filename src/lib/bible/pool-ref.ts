/** Shared ref normalization (safe for client + server). */
export function normalizePoolRef(ref: string): string {
  return ref.replace(/^Psalm\b/, "Psalms").replace(/\s+/g, " ").trim();
}
