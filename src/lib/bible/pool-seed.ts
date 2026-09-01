/** Deterministic hash for pool rotation (FNV-1a). */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickPoolIndex(seed: string, length: number): number {
  if (length <= 0) return 0;
  return hashSeed(seed) % length;
}

/** Seed for hourly verse: same date + hour + theme → same verse everywhere. */
export function hourlyPoolSeed(
  areaId: string,
  date: string,
  hour: number,
): string {
  return `${areaId}:${date}:${hour}`;
}

/** Local calendar date as YYYY-MM-DD. */
export function localDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
