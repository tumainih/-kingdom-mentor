import { backfillAbsentSlots } from "@/lib/reading/backfill";
import { dueReportWindows, periodKey } from "@/lib/reading/periods";
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
  }
  return count;
}
