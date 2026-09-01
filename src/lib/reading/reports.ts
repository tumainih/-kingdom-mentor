import { randomUUID } from "node:crypto";
import { periodKey } from "@/lib/reading/periods";
import {
  averageRate,
  lapseMsToRate,
  rateToColor,
} from "@/lib/reading/rates";
import {
  eventsInRange,
  getDeviceMeta,
  listReadingDeviceIds,
  listReports,
  saveReport,
} from "@/lib/reading/store.server";
import type { DevelopmentReport, ReportUnit } from "@/lib/reading/types";
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
}) {
  const lapseMs = Math.max(0, input.readAt - input.shownAt);
  const rate = lapseMsToRate(lapseMs);
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
  };
}

export function aggregateReport(
  deviceId: string,
  unit: ReportUnit,
  periodStart: number,
  periodEnd: number,
  events: Awaited<ReturnType<typeof eventsInRange>>,
): DevelopmentReport | null {
  if (!events.length) return null;

  const avgLapseMs =
    events.reduce((sum, e) => sum + e.lapseMs, 0) / events.length;
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
  };
}

export async function generateDueReportsForDevice(
  deviceId: string,
  now = new Date(),
): Promise<DevelopmentReport[]> {
  const meta = await getDeviceMeta(deviceId);
  if (!meta) return [];

  const windows = dueReportWindows(now, meta.timezone, meta.startedAt);
  const existing = await listReports(deviceId);
  const existingIds = new Set(existing.map((r) => r.id));
  const created: DevelopmentReport[] = [];

  for (const window of windows) {
    const id = periodKey(window.unit, window.start, window.end);
    if (existingIds.has(id)) continue;

    const events = await eventsInRange(deviceId, window.start, window.end);
    const report = aggregateReport(
      deviceId,
      window.unit,
      window.start,
      window.end,
      events,
    );
    if (!report) continue;

    await saveReport(report);
    created.push(report);
  }

  return created;
}

export async function generateAllDueReports(): Promise<number> {
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
  const body =
    sub.locale === "sw"
      ? `${report.unit} · wastani ${report.avgRate} · ${report.eventCount} mistari`
      : `${report.unit} · avg ${report.avgRate} · ${report.eventCount} verses read`;

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
