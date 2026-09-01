import type { ReportUnit } from "@/lib/reading/types";

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
    "24h": "24 hours",
    week: "Weekly",
    fortnight: "Fortnight",
    month: "Monthly",
    quarter: "Quarterly",
    year: "Yearly",
    "4year": "4 years",
    "10year": "10 years",
  };
  const sw: Record<ReportUnit, string> = {
    "3h": "Saa 3",
    "6h": "Saa 6",
    "12h": "Saa 12",
    "24h": "Saa 24",
    week: "Kila wiki",
    fortnight: "Wiki 2",
    month: "Kila mwezi",
    quarter: "Robo mwaka",
    year: "Kila mwaka",
    "4year": "Miaka 4",
    "10year": "Miaka 10",
  };
  return locale === "sw" ? sw[unit] : en[unit];
}

function startOfLocalDay(date: Date, tz: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
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

export interface PeriodWindow {
  unit: ReportUnit;
  start: number;
  end: number;
}

/** Returns report windows that close at the current local hour/day. */
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
    const hoursBack =
      unit === "3h" ? 3 : unit === "6h" ? 6 : unit === "12h" ? 12 : 24;
    const start = end - hoursBack * 60 * 60 * 1000;
    if (start >= appStartedAt) {
      due.push({ unit, start: Math.max(start, appStartedAt), end });
    }
  }

  if (hour === 0 && weekday === "Sat") {
    const start = end - 7 * 24 * 60 * 60 * 1000;
    if (start >= appStartedAt) {
      due.push({
        unit: "week",
        start: Math.max(start, appStartedAt),
        end,
      });
    }
    const fortnightStart = end - 14 * 24 * 60 * 60 * 1000;
    if (fortnightStart >= appStartedAt) {
      due.push({
        unit: "fortnight",
        start: Math.max(fortnightStart, appStartedAt),
        end,
      });
    }
  }

  if (hour === 0 && day === 1) {
    const monthStart = new Date(year, month - 2, 1).getTime();
    if (monthStart >= appStartedAt) {
      due.push({
        unit: "month",
        start: Math.max(monthStart, appStartedAt),
        end,
      });
    }
    if ([1, 4, 7, 10].includes(month)) {
      const qMonth = month <= 3 ? 1 : month <= 6 ? 4 : month <= 9 ? 7 : 10;
      const qStart = new Date(year, qMonth - 1, 1).getTime();
      if (qStart >= appStartedAt) {
        due.push({
          unit: "quarter",
          start: Math.max(qStart, appStartedAt),
          end,
        });
      }
    }
    if (month === 1) {
      const yStart = new Date(year, 0, 1).getTime();
      if (yStart >= appStartedAt) {
        due.push({ unit: "year", start: Math.max(yStart, appStartedAt), end });
      }
      if (year % 4 === 0) {
        const fourStart = end - 4 * 366 * 24 * 60 * 60 * 1000;
        if (fourStart >= appStartedAt) {
          due.push({
            unit: "4year",
            start: Math.max(fourStart, appStartedAt),
            end,
          });
        }
      }
      if (year % 10 === 0) {
        const tenStart = end - 10 * 365.25 * 24 * 60 * 60 * 1000;
        if (tenStart >= appStartedAt) {
          due.push({
            unit: "10year",
            start: Math.max(tenStart, appStartedAt),
            end,
          });
        }
      }
    }
  }

  return due.sort(
    (a, b) =>
      REPORT_UNIT_ORDER.indexOf(a.unit) - REPORT_UNIT_ORDER.indexOf(b.unit),
  );
}

export function periodKey(unit: ReportUnit, start: number, end: number): string {
  return `${unit}:${start}:${end}`;
}
