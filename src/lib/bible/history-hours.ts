/** Latest selectable hour (0–23) for History lookup on a given local calendar date. */
export function maxSelectableHourForDate(
  dateStr: string,
  now = new Date(),
): number {
  const today = localDateInputValue(now);
  if (dateStr > today) return -1;
  if (dateStr < today) return 23;
  return now.getHours();
}

export function isHourSelectableForDate(
  dateStr: string,
  hour: number,
  now = new Date(),
): boolean {
  if (hour < 0 || hour > 23) return false;
  const max = maxSelectableHourForDate(dateStr, now);
  if (max < 0) return false;
  return hour <= max;
}

export function clampHourForDate(
  dateStr: string,
  hour: number,
  now = new Date(),
): number {
  const max = maxSelectableHourForDate(dateStr, now);
  if (max < 0) return 0;
  return Math.min(Math.max(0, hour), max);
}

export function localDateInputValue(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function selectableHoursForDate(
  dateStr: string,
  now = new Date(),
): number[] {
  const max = maxSelectableHourForDate(dateStr, now);
  if (max < 0) return [];
  return Array.from({ length: max + 1 }, (_, h) => h);
}
