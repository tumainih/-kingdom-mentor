import { averageRate, rateToColor, UNREAD_COLOR } from "@/lib/reading/rates";
import { eventsInRange } from "@/lib/reading/report-math";
import { localDateKey, slotStartMs } from "@/lib/reading/slots";
import type { ReadEvent, ReportUnit } from "@/lib/reading/types";

export type DisplayUnit =
  | ReportUnit
  | "half"
  | "day";

export interface ScaleCell {
  id: string;
  label: string;
  unit: DisplayUnit;
  start: number;
  end: number;
  avgRate: number;
  color: string;
  eventCount: number;
  finished: boolean;
  reportUnit?: ReportUnit;
}

function nextDayKey(day: string, timezone: string): string {
  const probe = slotStartMs(day, 12, timezone) + 36 * 3_600_000;
  return localDateKey(probe, timezone);
}

function dayEndMs(day: string, timezone: string): number {
  return slotStartMs(nextDayKey(day, timezone), 0, timezone);
}

function monthStartMs(year: number, month: number, timezone: string): number {
  return slotStartMs(`${year}-${String(month).padStart(2, "0")}-01`, 0, timezone);
}

function monthEndMs(year: number, month: number, timezone: string): number {
  if (month === 12) return monthStartMs(year + 1, 1, timezone);
  return monthStartMs(year, month + 1, timezone);
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

export function aggregateScaleCell(
  id: string,
  label: string,
  unit: DisplayUnit,
  start: number,
  end: number,
  events: ReadEvent[],
  now: number,
  reportUnit?: ReportUnit,
): ScaleCell {
  const finished = end <= now;
  const inRange = eventsInRange(events, start, end);
  const avgRate = inRange.length ? averageRate(inRange.map((e) => e.rate)) : 0;
  const rounded = Math.round(avgRate * 10) / 10;
  const display = rounded <= 0 ? 0 : Math.min(6, rounded);
  const hasData = inRange.length > 0;
  const colorize = finished || hasData;

  return {
    id,
    label,
    unit,
    start,
    end,
    avgRate: display,
    color: colorize
      ? hasData
        ? rateToColor(Math.round(avgRate))
        : UNREAD_COLOR
      : "#334155",
    eventCount: inRange.length,
    finished: finished || hasData,
    reportUnit: reportUnit ?? (unit === "day" ? "24h" : unit === "half" ? undefined : (unit as ReportUnit)),
  };
}

export function buildYearCells(
  year: number,
  events: ReadEvent[],
  timezone: string,
  now: number,
  locale: "en" | "sw",
): {
  year: ScaleCell;
  halves: ScaleCell[];
  quarters: ScaleCell[];
  months: ScaleCell[];
} {
  const loc = locale === "sw" ? "sw-KE" : "en-US";
  const monthName = (m: number) =>
    new Intl.DateTimeFormat(loc, { month: "short" }).format(new Date(year, m - 1, 1));

  const yStart = monthStartMs(year, 1, timezone);
  const yEnd = monthStartMs(year + 1, 1, timezone);

  const yearCell = aggregateScaleCell(
    `year:${year}`,
    String(year),
    "year",
    yStart,
    yEnd,
    events,
    now,
    "year",
  );

  const halves = [
    aggregateScaleCell(
      `half:${year}-1`,
      locale === "sw" ? "Jan–Jun" : "Jan–Jun",
      "half",
      monthStartMs(year, 1, timezone),
      monthStartMs(year, 7, timezone),
      events,
      now,
    ),
    aggregateScaleCell(
      `half:${year}-2`,
      locale === "sw" ? "Jul–Dec" : "Jul–Dec",
      "half",
      monthStartMs(year, 7, timezone),
      yEnd,
      events,
      now,
    ),
  ];

  const quarters = [1, 4, 7, 10].map((qMonth, i) => {
    const qEnd = qMonth === 10 ? yEnd : monthStartMs(year, qMonth + 3, timezone);
    return aggregateScaleCell(
      `quarter:${year}-${i + 1}`,
      `Q${i + 1}`,
      "quarter",
      monthStartMs(year, qMonth, timezone),
      qEnd,
      events,
      now,
      "quarter",
    );
  });

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return aggregateScaleCell(
      `month:${year}-${month}`,
      monthName(month),
      "month",
      monthStartMs(year, month, timezone),
      monthEndMs(year, month, timezone),
      events,
      now,
      "month",
    );
  });

  return { year: yearCell, halves, quarters, months };
}

export function buildMonthCells(
  year: number,
  month: number,
  events: ReadEvent[],
  timezone: string,
  now: number,
  locale: "en" | "sw",
): { month: ScaleCell; weeks: ScaleCell[]; days: ScaleCell[] } {
  const loc = locale === "sw" ? "sw-KE" : "en-US";
  const mStart = monthStartMs(year, month, timezone);
  const mEnd = monthEndMs(year, month, timezone);
  const monthLabel = new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );

  const monthCell = aggregateScaleCell(
    `month:${year}-${month}`,
    monthLabel,
    "month",
    mStart,
    mEnd,
    events,
    now,
    "month",
  );

  const weeks: ScaleCell[] = [];
  let weekEnd = isoWeekStartMs(mStart, timezone) + 7 * 86_400_000;
  let guard = 0;
  while (weekEnd <= mEnd + 7 * 86_400_000 && guard++ < 6) {
    const weekStart = weekEnd - 7 * 86_400_000;
    if (weekEnd > mStart && weekStart < mEnd) {
      const label = new Intl.DateTimeFormat(loc, { month: "short", day: "numeric" }).format(
        new Date(weekStart),
      );
      weeks.push(
        aggregateScaleCell(
          `week:${weekStart}`,
          label,
          "week",
          weekStart,
          weekEnd,
          events,
          now,
          "week",
        ),
      );
    }
    weekEnd += 7 * 86_400_000;
  }

  const days: ScaleCell[] = [];
  let day = localDateKey(mStart, timezone);
  const lastDay = localDateKey(mEnd - 1, timezone);
  guard = 0;
  while (guard++ < 35) {
    const start = slotStartMs(day, 0, timezone);
    const end = dayEndMs(day, timezone);
    days.push(
      aggregateScaleCell(
        `day:${day}`,
        day.slice(-2),
        "day",
        start,
        end,
        events,
        now,
        "24h",
      ),
    );
    if (day === lastDay) break;
    day = nextDayKey(day, timezone);
  }

  return { month: monthCell, weeks, days };
}

/** Stepwise blocks: 12h → 6h → 3h → 1h within a day or sub-range. */
export function buildDayDrillBlocks(
  dayStart: number,
  dayEnd: number,
  events: ReadEvent[],
  timezone: string,
  now: number,
  level: "12h" | "6h" | "3h" | "1h",
  rangeStart?: number,
  rangeEnd?: number,
): ScaleCell[] {
  const blockHours = level === "12h" ? 12 : level === "6h" ? 6 : level === "3h" ? 3 : 1;
  const windowStart = rangeStart ?? dayStart;
  const windowEnd = rangeEnd ?? dayEnd;
  const cells: ScaleCell[] = [];

  for (let t = windowStart; t < windowEnd; t += blockHours * 3_600_000) {
    const end = Math.min(t + blockHours * 3_600_000, windowEnd);
    if (end <= t) break;
    const startHour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
        hourCycle: "h23",
      }).format(new Date(t)),
    );
    const label = `${String(startHour).padStart(2, "0")}:00–${String((startHour + blockHours) % 24).padStart(2, "0")}:00`;

    cells.push(
      aggregateScaleCell(
        `${level}:${t}:${end}`,
        label,
        level,
        t,
        end,
        events,
        now,
        level,
      ),
    );
  }

  return cells;
}

export function trackingYears(startedAt: number, timezone: string, now: number): number[] {
  const startYear = Number(localDateKey(startedAt, timezone).slice(0, 4));
  const endYear = Number(localDateKey(now, timezone).slice(0, 4));
  const years: number[] = [];
  for (let y = endYear; y >= startYear; y--) years.push(y);
  return years.length ? years : [endYear];
}

export function firstWeekdayOffset(year: number, month: number, timezone: string): number {
  const day = localDateKey(monthStartMs(year, month, timezone), timezone);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(new Date(monthStartMs(year, month, timezone)));
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}
