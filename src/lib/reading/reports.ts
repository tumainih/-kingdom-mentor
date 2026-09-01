import { backfillAbsentSlots } from "@/lib/reading/backfill";
import { dueReportWindows, periodKey, reportUnitLabel } from "@/lib/reading/periods";
import { aggregateReport, buildReadEvent } from "@/lib/reading/report-math";
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
import { ensureWebPush, webpush } from "@/lib/push/vapid";
import { listPushSubscriptions } from "@/lib/push/store";

export { buildReadEvent, aggregateReport } from "@/lib/reading/report-math";

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
  const label =
    report.customLabel ||
    (report.unit === "custom"
      ? sub.locale === "sw"
        ? "Masafa maalum"
        : "Custom range"
      : reportUnitLabel(report.unit, sub.locale));
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
