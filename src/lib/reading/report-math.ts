import { averageRate, lapseMsToRate, rateToColor } from "@/lib/reading/rates";
import { periodKey } from "@/lib/reading/periods";
import type { DevelopmentReport, ReadEvent, ReportUnit } from "@/lib/reading/types";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `kn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function buildReadEvent(input: {
  deviceId: string;
  notificationId: string;
  shownAt: number;
  readAt: number;
  hour: number;
  verseRef: string;
  theme: string;
  themeLabel: string;
  locale: "en" | "sw";
  timezone: string;
  missed?: boolean;
}): ReadEvent {
  const missed = Boolean(input.missed);
  const lapseMs = missed ? 0 : Math.max(0, input.readAt - input.shownAt);
  const rate = lapseMsToRate(lapseMs, missed);
  return {
    id: newId(),
    deviceId: input.deviceId,
    notificationId: input.notificationId,
    shownAt: input.shownAt,
    readAt: input.readAt,
    lapseMs,
    rate,
    hour: input.hour,
    verseRef: input.verseRef,
    theme: input.theme,
    themeLabel: input.themeLabel,
    locale: input.locale,
    timezone: input.timezone,
    missed,
  };
}

export function aggregateReport(
  deviceId: string,
  unit: ReportUnit,
  periodStart: number,
  periodEnd: number,
  events: ReadEvent[],
  customLabel?: string,
): DevelopmentReport | null {
  if (!events.length) return null;

  const avgLapseMs =
    events.reduce((sum, e) => sum + (e.missed ? 0 : e.lapseMs), 0) / events.length;
  const avgRate = averageRate(events.map((e) => e.rate));
  const roundedRate = Math.round(avgRate * 10) / 10;

  return {
    id: periodKey(unit, periodStart, periodEnd),
    deviceId,
    unit,
    periodStart,
    periodEnd,
    generatedAt: Date.now(),
    eventCount: events.length,
    avgLapseMs,
    avgRate: roundedRate,
    color: rateToColor(Math.round(avgRate)),
    note: null,
    submittedAt: null,
    notifiedAt: null,
    customLabel,
  };
}

export function eventsInRange(
  events: ReadEvent[],
  start: number,
  end: number,
): ReadEvent[] {
  return events.filter(
    (e) =>
      (e.shownAt >= start && e.shownAt <= end) ||
      (e.readAt >= start && e.readAt <= end),
  );
}

export function generateReportFromEvents(
  deviceId: string,
  unit: ReportUnit,
  periodStart: number,
  periodEnd: number,
  allEvents: ReadEvent[],
  customLabel?: string,
): DevelopmentReport | null {
  const events = eventsInRange(allEvents, periodStart, periodEnd);
  return aggregateReport(deviceId, unit, periodStart, periodEnd, events, customLabel);
}
