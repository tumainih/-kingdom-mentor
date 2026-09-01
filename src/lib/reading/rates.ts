/** Unread by whole hour → 0. Read: 0–9s → 1, 10–19s → 2, … */
export function lapseMsToRate(lapseMs: number, missed = false): number {
  if (missed) return 0;
  const seconds = Math.max(0, lapseMs / 1000);
  return Math.floor(seconds / 10) + 1;
}

export const UNREAD_RATE = 0;
export const UNREAD_COLOR = "#92400e";

/** Rate 0 = brown (unread). Rates 1–6+ whitish → reddish. */
const RATE_COLORS = [
  "#f8fafc",
  "#fde8e8",
  "#fecaca",
  "#fca5a5",
  "#ef4444",
  "#b91c1c",
] as const;

export function rateToColor(rate: number): string {
  if (rate <= 0) return UNREAD_COLOR;
  const idx = Math.min(RATE_COLORS.length - 1, Math.max(0, rate - 1));
  return RATE_COLORS[idx]!;
}

export function averageRate(rates: number[]): number {
  if (!rates.length) return 0;
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

export function formatLapse(ms: number, missed = false): string {
  if (missed) return "—";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem ? `${min}m ${rem}s` : `${min}m`;
}

function localHour(at: number, timezone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
      hourCycle: "h23",
    }).format(new Date(at)),
  );
}

/** First ms of the next local hour — unread notifications become rate 0 after this. */
export function hourEndsAtMs(at: number, timezone: string): number {
  const startHour = localHour(at, timezone);
  let probe = at + 60_000;
  while (localHour(probe, timezone) === startHour && probe - at < 3_700_000) {
    probe += 60_000;
  }
  return probe;
}
