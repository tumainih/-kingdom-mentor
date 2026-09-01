import { hourEndsAtMs } from "@/lib/reading/rates";
import type { ReadEvent } from "@/lib/reading/types";

export const DEFAULT_TRACKING_HOURS = [6, 9, 12, 15, 18];

export function localDateKey(at: number, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at));
}

export function localHourAt(at: number, timezone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
      hourCycle: "h23",
    }).format(new Date(at)),
  );
}

export function slotKey(day: string, hour: number): string {
  return `${day}:${hour}`;
}

export function eventSlotKey(event: ReadEvent): string {
  return slotKey(localDateKey(event.shownAt, event.timezone), event.hour);
}

/** Local midnight for a YYYY-MM-DD calendar day in the given timezone. */
export function slotStartMs(day: string, hour: number, timezone: string): number {
  const [y, m, d] = day.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d, 12, 0, 0);
  for (let offset = -36; offset <= 36; offset++) {
    const probe = base + offset * 3600_000;
    if (localDateKey(probe, timezone) === day && localHourAt(probe, timezone) === hour) {
      return probe;
    }
  }
  return base;
}

export interface ExpectedSlot {
  slotKey: string;
  day: string;
  hour: number;
  startMs: number;
  endMs: number;
}

export function* iterExpectedSlots(
  startedAt: number,
  now: number,
  timezone: string,
  notifyHours: number[],
): Generator<ExpectedSlot> {
  const hours = [...new Set(notifyHours)].sort((a, b) => a - b);
  if (!hours.length) return;

  let day = localDateKey(startedAt, timezone);
  const endDay = localDateKey(now, timezone);
  let guard = 0;

  while (guard++ < 4000) {
    for (const hour of hours) {
      const startMs = slotStartMs(day, hour, timezone);
      const endMs = hourEndsAtMs(startMs, timezone);
      if (endMs <= startedAt) continue;
      if (startMs > now) continue;
      if (endMs > now) continue;

      yield {
        slotKey: slotKey(day, hour),
        day,
        hour,
        startMs,
        endMs,
      };
    }

    if (day === endDay) break;
    const nextStart = slotStartMs(day, 12, timezone) + 36 * 3600_000;
    day = localDateKey(nextStart, timezone);
  }
}

export function coveredSlotKeys(events: ReadEvent[]): Set<string> {
  return new Set(events.map((event) => eventSlotKey(event)));
}
