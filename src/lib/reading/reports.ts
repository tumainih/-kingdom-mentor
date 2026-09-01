import { randomUUID } from "node:crypto";
import { backfillAbsentSlots } from "@/lib/reading/backfill";
import { periodKey } from "@/lib/reading/periods";
import {
  averageRate,
  lapseMsToRate,
  rateToColor,
} from "@/lib/reading/rates";
import {
  eventsInRange,
  getDeviceMeta,
  listAllPendingNotifications,
  listReadingDeviceIds,
  listReadEvents,
  listReports,
  removePendingNotification,
  saveReadEvent,
  saveReport,
} from "@/lib/reading/store.server";
import type { DevelopmentReport, PendingNotification, ReadEvent, ReportUnit } from "@/lib/reading/types";
import { dueReportWindows } from "@/lib/reading/periods";
import { ensureWebPush, webpush } from "@/lib/push/vapid";
import { listPushSubscriptions } from "@/lib/push/store";

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
    id: randomUUID(),
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

function buildMissedFromPending(pending: PendingNotification, readAt: number): ReadEvent {
  return buildReadEvent({
    deviceId: pending.deviceId,
    notificationId: pending.notificationId,
    shownAt: pending.shownAt,
    readAt,
    hour: pending.hour,
    verseRef: pending.verseRef,
    theme: pending.theme,
    themeLabel: pending.themeLabel,
    locale: pending.locale,
    timezone: pending.timezone,
    missed: true,
  });
}

export async function closeMissedNotifications(now = Date.now()): Promise<number> {
  const pending = await listAllPendingNotifications();
  let closed = 0;

  for (const p of pending) {
    if (now < p.hourEndsAt) continue;

    if (p.isTest) {
      await removePendingNotification(p.deviceId, p.notificationId);
      continue;
    }

    const allEvents = await listReadEvents(p.deviceId);
    if (allEvents.some((e) => e.notificationId === p.notificationId)) {
      await removePendingNotification(p.deviceId, p.notificationId);
      continue;
    }

    await saveReadEvent(buildMissedFromPending(p, p.hourEndsAt));
    closed++;
  }

  return closed;
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

export async function generateReportForRange(
  deviceId: string,
  unit: ReportUnit,
  periodStart: number,
  periodEnd: number,
  customLabel?: string,
): Promise<DevelopmentReport | null> {
  await backfillAbsentSlots(deviceId, periodEnd);
  const events = await eventsInRange(deviceId, periodStart, periodEnd);
  return aggregateReport(deviceId, unit, periodStart, periodEnd, events, customLabel);
}

export async function generateDueReportsForDevice(
  deviceId: string,
  now = new Date(),
): Promise<DevelopmentReport[]> {
  const meta = await getDeviceMeta(deviceId);
  if (!meta) return [];

  await backfillAbsentSlots(deviceId, now.getTime());

  const windows = dueReportWindows(now, meta.timezone, meta.startedAt);
  const existing = await listReports(deviceId);
  const existingIds = new Set(existing.map((r) => r.id));
  const created: DevelopmentReport[] = [];

  for (const window of windows) {
    const id = periodKey(window.unit, window.start, window.end);
    if (existingIds.has(id)) continue;

    const report = await generateReportForRange(
      deviceId,
      window.unit,
      window.start,
      window.end,
    );
    if (!report) continue;

    await saveReport(report);
    created.push(report);
  }

  return created;
}

export async function generateAllDueReports(): Promise<number> {
  await closeMissedNotifications();
  const { backfillAllDevices } = await import("@/lib/reading/backfill");
  await backfillAllDevices();

  const deviceIds = await listReadingDeviceIds();
  let count = 0;
  for (const deviceId of deviceIds) {
    const reports = await generateDueReportsForDevice(deviceId);
    count += reports.length;
    for (const report of reports) {
      await notifyReportReady(deviceId, report);
    }
  }
  return count;
}

async function notifyReportReady(
  deviceId: string,
  report: DevelopmentReport,
): Promise<void> {
  if (!ensureWebPush()) return;

  const subs = await listPushSubscriptions();
  const sub = subs.find((s) => s.deviceId === deviceId);
  if (!sub) return;

  const title = sub.locale === "sw" ? "Ripoti ya maendeleo" : "Development report";
  const label = report.customLabel || report.unit;
  const body =
    sub.locale === "sw"
      ? `${label} · wastani ${report.avgRate} · ${report.eventCount} arifa`
      : `${label} · avg ${report.avgRate} · ${report.eventCount} alerts`;

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify({
        title,
        body,
        url: `/reports?report=${encodeURIComponent(report.id)}`,
        type: "report",
        reportId: report.id,
        locale: sub.locale,
        deviceId,
      }),
    );
    report.notifiedAt = Date.now();
    await saveReport(report);
  } catch {
    /* best-effort */
  }
}
