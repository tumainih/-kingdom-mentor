import type { ReportUnit } from "@/lib/reading/types";
import { localDateKey, slotStartMs } from "@/lib/reading/slots";

/** Hours (0–23) when each hourly block ends (local device timezone). */
export const REPORT_TRIGGER_HOURS: Partial<Record<ReportUnit, number[]>> = {
  "1h": Array.from({ length: 24 }, (_, i) => i),
  "3h": [3, 6, 9, 12, 15, 18, 21, 0],
  "6h": [6, 12, 18, 0],
  "12h": [12, 0],
  "24h": [0],
};

export const REPORT_UNIT_ORDER: ReportUnit[] = [
  "1h",
  "3h",
  "6h",
  "12h",
  "24h",
  "week",
  "fortnight",
  "month",
  "quarter",
  "year",
  "4year",
  "10year",
];

export function reportUnitLabel(unit: ReportUnit, locale: "en" | "sw"): string {
  const en: Record<ReportUnit, string> = {
    "1h": "1 hour",
    "3h": "3 hours",
    "6h": "6 hours",
    "12h": "12 hours",
    "24h": "Daily",
    week: "Weekly",
    fortnight: "Fortnight",
    month: "Monthly",
    quarter: "Quarterly",
    year: "Yearly",
    "4year": "4 years",
    "10year": "10 years",
    custom: "Custom range",
  };
  const sw: Record<ReportUnit, string> = {
    "1h": "Saa 1",
    "3h": "Saa 3",
    "6h": "Saa 6",
    "12h": "Saa 12",
    "24h": "Kila siku",
    week: "Kila wiki",
    fortnight: "Wiki 2",
    month: "Kila mwezi",
    quarter: "Robo mwaka",
    year: "Kila mwaka",
    "4year": "Miaka 4",
    "10year": "Miaka 10",
    custom: "Masafa maalum",
  };
  return locale === "sw" ? sw[unit] : en[unit];
}

function blockHoursForUnit(unit: ReportUnit): number {
  switch (unit) {
    case "1h":
      return 1;
    case "3h":
      return 3;
    case "6h":
      return 6;
    case "12h":
      return 12;
    default:
      return 24;
  }
}

function nextDayKey(day: string, timezone: string): string {
  const probe = slotStartMs(day, 12, timezone) + 36 * 3_600_000;
  return localDateKey(probe, timezone);
}

function dayEndMs(day: string, timezone: string): number {
  return slotStartMs(nextDayKey(day, timezone), 0, timezone);
}

function isoWeekStartMs(at: number, timezone: string): number {
  const probe = new Date(at);
  for (let i = 0; i < 8; i++) {
    const day = localDateKey(probe.getTime(), timezone);
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
    }).format(probe);
    if (weekday === "Mon") return slotStartMs(day, 0, timezone);
    probe.setTime(probe.getTime() - 86_400_000);
  }
  return slotStartMs(localDateKey(at, timezone), 0, timezone);
}

function monthStartMs(year: number, month: number, timezone: string): number {
  return slotStartMs(`${year}-${String(month).padStart(2, "0")}-01`, 0, timezone);
}

function localYearMonth(at: number, timezone: string): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date(at));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  return { year: get("year"), month: get("month") };
}

export interface PeriodWindow {
  unit: ReportUnit;
  start: number;
  end: number;
}

function pushWindow(
  windows: PeriodWindow[],
  unit: ReportUnit,
  start: number,
  end: number,
  appStartedAt: number,
  now: number,
): void {
  if (end <= appStartedAt || end > now) return;
  windows.push({
    unit,
    start: Math.max(start, appStartedAt),
    end,
  });
}

function hourBlockWindows(
  unit: "1h" | "3h" | "6h" | "12h",
  appStartedAt: number,
  now: number,
  timezone: string,
): PeriodWindow[] {
  const endHours = REPORT_TRIGGER_HOURS[unit] ?? [];
  const blockHours = blockHoursForUnit(unit);
  const windows: PeriodWindow[] = [];

  let day = localDateKey(appStartedAt, timezone);
  const lastDay = localDateKey(now, timezone);
  let guard = 0;

  while (guard++ < 5000) {
    for (const endHour of endHours) {
      const end = slotStartMs(day, endHour, timezone);
      const start = end - blockHours * 3_600_000;
      pushWindow(windows, unit, start, end, appStartedAt, now);
    }

    if (day === lastDay) break;
    day = nextDayKey(day, timezone);
  }

  return windows;
}

function dailyWindows(
  appStartedAt: number,
  now: number,
  timezone: string,
): PeriodWindow[] {
  const windows: PeriodWindow[] = [];
  let day = localDateKey(appStartedAt, timezone);
  const today = localDateKey(now, timezone);
  let guard = 0;

  while (guard++ < 5000) {
    const start = slotStartMs(day, 0, timezone);
    const end = dayEndMs(day, timezone);
    pushWindow(windows, "24h", start, end, appStartedAt, now);

    if (day === today) break;
    day = nextDayKey(day, timezone);
  }

  return windows;
}

function weeklyWindows(
  appStartedAt: number,
  now: number,
  timezone: string,
): PeriodWindow[] {
  const windows: PeriodWindow[] = [];
  let probe = isoWeekStartMs(appStartedAt, timezone) + 7 * 86_400_000;
  let guard = 0;

  while (probe <= now && guard++ < 500) {
    const weekStart = probe - 7 * 86_400_000;
    pushWindow(windows, "week", weekStart, probe, appStartedAt, now);
    probe += 7 * 86_400_000;
  }

  return windows;
}

function fortnightlyWindows(
  appStartedAt: number,
  now: number,
  timezone: string,
): PeriodWindow[] {
  const windows: PeriodWindow[] = [];
  let probe = isoWeekStartMs(appStartedAt, timezone) + 14 * 86_400_000;
  let guard = 0;

  while (probe <= now && guard++ < 300) {
    const fortnightStart = probe - 14 * 86_400_000;
    pushWindow(windows, "fortnight", fortnightStart, probe, appStartedAt, now);
    probe += 14 * 86_400_000;
  }

  return windows;
}

function monthlyWindows(
  appStartedAt: number,
  now: number,
  timezone: string,
): PeriodWindow[] {
  const windows: PeriodWindow[] = [];
  let { year, month } = localYearMonth(appStartedAt, timezone);
  let guard = 0;

  while (guard++ < 500) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const end = monthStartMs(year, month, timezone);
    if (end > now) break;

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const start = monthStartMs(prevYear, prevMonth, timezone);
    pushWindow(windows, "month", start, end, appStartedAt, now);
  }

  return windows;
}

function quarterlyWindows(
  appStartedAt: number,
  now: number,
  timezone: string,
): PeriodWindow[] {
  const windows: PeriodWindow[] = [];
  const quarterStarts = [1, 4, 7, 10];
  let { year, month } = localYearMonth(appStartedAt, timezone);
  let guard = 0;

  while (guard++ < 200) {
    const nextQuarterMonth = quarterStarts.find((m) => m > month);
    if (nextQuarterMonth) {
      month = nextQuarterMonth;
    } else {
      month = 1;
      year += 1;
    }

    const end = monthStartMs(year, month, timezone);
    if (end > now) break;

    let startMonth = month - 3;
    let startYear = year;
    if (startMonth <= 0) {
      startMonth += 12;
      startYear -= 1;
    }
    const start = monthStartMs(startYear, startMonth, timezone);
    pushWindow(windows, "quarter", start, end, appStartedAt, now);
  }

  return windows;
}

function yearlyWindows(
  appStartedAt: number,
  now: number,
  timezone: string,
): PeriodWindow[] {
  const windows: PeriodWindow[] = [];
  let year = localYearMonth(appStartedAt, timezone).year + 1;
  let guard = 0;

  while (guard++ < 100) {
    const end = monthStartMs(year, 1, timezone);
    if (end > now) break;
    const start = monthStartMs(year - 1, 1, timezone);
    pushWindow(windows, "year", start, end, appStartedAt, now);
    year += 1;
  }

  return windows;
}

function fourYearWindows(
  appStartedAt: number,
  now: number,
  timezone: string,
): PeriodWindow[] {
  const windows: PeriodWindow[] = [];
  let endYear = localYearMonth(appStartedAt, timezone).year;

  while ((endYear - 1) % 4 !== 0) endYear += 1;
  if (monthStartMs(endYear, 1, timezone) <= appStartedAt) endYear += 4;

  let guard = 0;
  while (guard++ < 30) {
    const end = monthStartMs(endYear, 1, timezone);
    if (end > now) break;
    const start = monthStartMs(endYear - 4, 1, timezone);
    pushWindow(windows, "4year", start, end, appStartedAt, now);
    endYear += 4;
  }

  return windows;
}

function tenYearWindows(
  appStartedAt: number,
  now: number,
  timezone: string,
): PeriodWindow[] {
  const windows: PeriodWindow[] = [];
  let endYear = localYearMonth(appStartedAt, timezone).year;

  while ((endYear - 1) % 10 !== 0) endYear += 1;
  if (monthStartMs(endYear, 1, timezone) <= appStartedAt) endYear += 10;

  let guard = 0;
  while (guard++ < 10) {
    const end = monthStartMs(endYear, 1, timezone);
    if (end > now) break;
    const start = monthStartMs(endYear - 10, 1, timezone);
    pushWindow(windows, "10year", start, end, appStartedAt, now);
    endYear += 10;
  }

  return windows;
}

/** All completed natural periods since tracking began — one report per unit level per period. */
export function completedReportWindows(
  appStartedAt: number,
  now: number,
  timezone: string,
): PeriodWindow[] {
  const windows: PeriodWindow[] = [
    ...hourBlockWindows("1h", appStartedAt, now, timezone),
    ...hourBlockWindows("3h", appStartedAt, now, timezone),
    ...hourBlockWindows("6h", appStartedAt, now, timezone),
    ...hourBlockWindows("12h", appStartedAt, now, timezone),
    ...dailyWindows(appStartedAt, now, timezone),
    ...weeklyWindows(appStartedAt, now, timezone),
    ...fortnightlyWindows(appStartedAt, now, timezone),
    ...monthlyWindows(appStartedAt, now, timezone),
    ...quarterlyWindows(appStartedAt, now, timezone),
    ...yearlyWindows(appStartedAt, now, timezone),
    ...fourYearWindows(appStartedAt, now, timezone),
    ...tenYearWindows(appStartedAt, now, timezone),
  ];

  const seen = new Set<string>();
  const unique: PeriodWindow[] = [];
  for (const window of windows) {
    const key = periodKey(window.unit, window.start, window.end);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(window);
  }

  return unique.sort(
    (a, b) =>
      REPORT_UNIT_ORDER.indexOf(a.unit) - REPORT_UNIT_ORDER.indexOf(b.unit) ||
      a.end - b.end,
  );
}

/** @deprecated Use completedReportWindows — kept for callers passing Date. */
export function dueReportWindows(
  now: Date,
  timezone: string,
  appStartedAt: number,
): PeriodWindow[] {
  return completedReportWindows(appStartedAt, now.getTime(), timezone);
}

export function periodKey(unit: ReportUnit, start: number, end: number): string {
  if (unit === "custom") return `custom:${start}:${end}`;
  return `${unit}:${start}:${end}`;
}
