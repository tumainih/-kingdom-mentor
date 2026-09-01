import type { ReportUnit } from "@/lib/reading/types";
import { localDateKey, slotStartMs } from "@/lib/reading/slots";

/** Hours (0–23) when each unit’s report is generated (local device timezone). */
export const REPORT_TRIGGER_HOURS: Partial<Record<ReportUnit, number[]>> = {
  "3h": [3, 6, 9, 12, 15, 18, 21, 0],
  "6h": [6, 12, 18, 0],
  "12h": [12, 0],
  "24h": [0],
};

export const REPORT_UNIT_ORDER: ReportUnit[] = [
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

function localParts(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    hour12: false,
    hourCycle: "h23",
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    hour: Number(get("hour")),
    weekday: get("weekday"),
    day: Number(get("day")),
    month: Number(get("month")),
    year: Number(get("year")),
  };
}

function localDayStartMs(at: number, tz: string): number {
  const day = localDateKey(at, tz);
  return slotStartMs(day, 0, tz);
}

function previousLocalDayStartMs(at: number, tz: string): number {
  return localDayStartMs(at, tz) - 86_400_000;
}

function naturalBlockWindow(
  endHour: number,
  blockHours: number,
  now: Date,
  tz: string,
): { start: number; end: number } {
  const end = now.getTime();
  const dayStart = localDayStartMs(end, tz);
  const startHour = endHour - blockHours;
  if (startHour >= 0) {
    return { start: dayStart + startHour * 3_600_000, end };
  }
  const prevDayStart = dayStart - 86_400_000;
  return { start: prevDayStart + (24 + startHour) * 3_600_000, end };
}

function isoWeekStartMs(at: number, tz: string): number {
  const probe = new Date(at);
  for (let i = 0; i < 8; i++) {
    const day = localDateKey(probe.getTime(), tz);
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
    }).format(probe);
    if (weekday === "Mon") return slotStartMs(day, 0, tz);
    probe.setTime(probe.getTime() - 86_400_000);
  }
  return localDayStartMs(at, tz);
}

export interface PeriodWindow {
  unit: ReportUnit;
  start: number;
  end: number;
}

/** Natural calendar-aligned report windows that close at the current local hour/day. */
export function dueReportWindows(
  now: Date,
  timezone: string,
  appStartedAt: number,
): PeriodWindow[] {
  const { hour, weekday, day, month, year } = localParts(now, timezone);
  const due: PeriodWindow[] = [];
  const end = now.getTime();

  for (const [unit, hours] of Object.entries(REPORT_TRIGGER_HOURS) as [
    ReportUnit,
    number[],
  ][]) {
    if (!hours.includes(hour)) continue;
    const blockHours =
      unit === "3h" ? 3 : unit === "6h" ? 6 : unit === "12h" ? 12 : 24;
    const start =
      unit === "24h"
        ? previousLocalDayStartMs(end, timezone)
        : naturalBlockWindow(hour, blockHours, now, timezone).start;
    due.push({ unit, start: Math.max(start, appStartedAt), end });
  }

  if (hour === 0 && weekday === "Mon") {
    const weekStart = isoWeekStartMs(end - 86_400_000, timezone);
    due.push({
      unit: "week",
      start: Math.max(weekStart, appStartedAt),
      end,
    });
    const fortnightStart = weekStart - 7 * 86_400_000;
    due.push({
      unit: "fortnight",
      start: Math.max(fortnightStart, appStartedAt),
      end,
    });
  }

  if (hour === 0 && day === 1) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthStart = slotStartMs(
      `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`,
      0,
      timezone,
    );
    due.push({
      unit: "month",
      start: Math.max(prevMonthStart, appStartedAt),
      end,
    });

    if ([1, 4, 7, 10].includes(month)) {
      const qMonth = month <= 3 ? 1 : month <= 6 ? 4 : month <= 9 ? 7 : 10;
      const qStart = slotStartMs(`${year}-${String(qMonth).padStart(2, "0")}-01`, 0, timezone);
      due.push({
        unit: "quarter",
        start: Math.max(qStart, appStartedAt),
        end,
      });
    }

    if (month === 1) {
      const yStart = slotStartMs(`${year - 1}-01-01`, 0, timezone);
      due.push({ unit: "year", start: Math.max(yStart, appStartedAt), end });
      if ((year - 1) % 4 === 0) {
        const fourStart = slotStartMs(`${year - 4}-01-01`, 0, timezone);
        due.push({
          unit: "4year",
          start: Math.max(fourStart, appStartedAt),
          end,
        });
      }
      if ((year - 1) % 10 === 0) {
        const tenStart = slotStartMs(`${year - 10}-01-01`, 0, timezone);
        due.push({
          unit: "10year",
          start: Math.max(tenStart, appStartedAt),
          end,
        });
      }
    }
  }

  return due.sort(
    (a, b) =>
      REPORT_UNIT_ORDER.indexOf(a.unit) - REPORT_UNIT_ORDER.indexOf(b.unit),
  );
}

export function periodKey(unit: ReportUnit, start: number, end: number): string {
  if (unit === "custom") return `custom:${start}:${end}`;
  return `${unit}:${start}:${end}`;
}
