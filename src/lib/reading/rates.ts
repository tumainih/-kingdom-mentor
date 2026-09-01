/** 0–9s → 1, 10–19s → 2, … 50–59s → 6, 60s+ continues upward */
export function lapseMsToRate(lapseMs: number): number {
  const seconds = Math.max(0, lapseMs / 1000);
  return Math.floor(seconds / 10) + 1;
}

/** Six-step whitish → reddish palette (rates 1–6+ share cap color). */
const RATE_COLORS = [
  "#f8fafc",
  "#fde8e8",
  "#fecaca",
  "#fca5a5",
  "#ef4444",
  "#b91c1c",
] as const;

export function rateToColor(rate: number): string {
  const idx = Math.min(RATE_COLORS.length - 1, Math.max(0, rate - 1));
  return RATE_COLORS[idx]!;
}

export function averageRate(rates: number[]): number {
  if (!rates.length) return 0;
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

export function formatLapse(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem ? `${min}m ${rem}s` : `${min}m`;
}
