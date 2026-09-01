import {
  isHourSelectableForDate,
  localDateInputValue,
  maxSelectableHourForDate,
} from "./history-hours";

export interface HistorySlot {
  date: string;
  hour: number;
}

/** Max slots in one range lookup (7 days of hours). */
export const MAX_HISTORY_RANGE_SLOTS = 168;

function slotTimestamp(date: string, hour: number): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, hour, 0, 0, 0).getTime();
}

export function compareHistorySlots(a: HistorySlot, b: HistorySlot): number {
  return slotTimestamp(a.date, a.hour) - slotTimestamp(b.date, b.hour);
}

export function normalizeHistoryRange(
  from: HistorySlot,
  to: HistorySlot,
): { from: HistorySlot; to: HistorySlot } {
  if (compareHistorySlots(from, to) <= 0) {
    return { from, to };
  }
  return { from: to, to: from };
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(y, m - 1, d + days);
  return localDateInputValue(next);
}

export function clampSlotToPast(
  slot: HistorySlot,
  now = new Date(),
): HistorySlot | null {
  const today = localDateInputValue(now);
  if (slot.date > today) return null;

  const maxHour = maxSelectableHourForDate(slot.date, now);
  if (maxHour < 0) return null;

  return {
    date: slot.date,
    hour: Math.min(Math.max(0, slot.hour), maxHour),
  };
}

export function enumerateHistoryRange(
  from: HistorySlot,
  to: HistorySlot,
  now = new Date(),
  maxSlots = MAX_HISTORY_RANGE_SLOTS,
): { slots: HistorySlot[]; truncated: boolean; totalMatched: number } {
  const start = clampSlotToPast(from, now);
  const end = clampSlotToPast(to, now);
  if (!start || !end) {
    return { slots: [], truncated: false, totalMatched: 0 };
  }

  const { from: rangeStart, to: rangeEnd } = normalizeHistoryRange(start, end);
  const slots: HistorySlot[] = [];
  let totalMatched = 0;
  let truncated = false;

  let cursor: HistorySlot = { ...rangeStart };

  while (compareHistorySlots(cursor, rangeEnd) <= 0) {
    if (isHourSelectableForDate(cursor.date, cursor.hour, now)) {
      totalMatched++;
      if (slots.length < maxSlots) {
        slots.push({ ...cursor });
      } else {
        truncated = true;
      }
    }

    if (cursor.hour < 23) {
      cursor = { date: cursor.date, hour: cursor.hour + 1 };
    } else {
      cursor = { date: addDaysToDateString(cursor.date, 1), hour: 0 };
    }

    if (compareHistorySlots(cursor, rangeEnd) > 0) break;
    if (totalMatched > maxSlots + 500) break;
  }

  return { slots, truncated, totalMatched };
}

export function countHistoryRange(
  from: HistorySlot,
  to: HistorySlot,
  now = new Date(),
): number {
  return enumerateHistoryRange(from, to, now, Number.MAX_SAFE_INTEGER).totalMatched;
}
