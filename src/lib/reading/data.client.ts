import { idbPut } from "@/lib/reading/idb";
import { getNotifyHours } from "@/lib/notifications/verse-notifications";
import { backfillAbsentSlotsClient, ensureReadingMetaClient } from "@/lib/reading/backfill.client";
import { dueReportWindows, periodKey } from "@/lib/reading/periods";
import { generateReportFromEvents } from "@/lib/reading/report-math";
import {
  ensureDeviceMetaClient,
  getDeviceMetaClient,
  listReadEventsClient,
  listReportsClient,
  saveReadEventClient,
  saveReportClient,
} from "@/lib/reading/store.client";
import type { DevelopmentReport, ReadEvent, ReportUnit } from "@/lib/reading/types";

function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

async function mergeServerPayload(
  deviceId: string,
  data: {
    meta?: { startedAt?: number; timezone?: string; locale?: "en" | "sw" };
    events?: ReadEvent[];
    reports?: DevelopmentReport[];
  },
): Promise<void> {
  if (data.meta?.startedAt) {
    const local = await getDeviceMetaClient(deviceId);
    if (!local) {
      await ensureDeviceMetaClient(
        deviceId,
        data.meta.timezone ?? "UTC",
        data.meta.locale ?? "en",
      );
    } else if (data.meta.startedAt < local.startedAt) {
      local.startedAt = data.meta.startedAt;
      await idbPut("meta", local);
    }
  }

  for (const event of data.events ?? []) {
    if (event.deviceId === deviceId) await saveReadEventClient(event);
  }

  for (const report of data.reports ?? []) {
    if (report.deviceId === deviceId) await saveReportClient(report);
  }
}

export async function syncReadingFromServer(
  deviceId: string,
  timezone: string,
  locale: "en" | "sw",
): Promise<void> {
  if (!isOnline()) return;

  try {
    const res = await fetch(
      `/api/reading/events?${new URLSearchParams({
        deviceId,
        timezone,
        locale,
        notifyHours: JSON.stringify(getNotifyHours()),
      })}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as {
      meta?: { startedAt?: number; timezone?: string; locale?: "en" | "sw" };
      events?: ReadEvent[];
      reports?: DevelopmentReport[];
    };
    await mergeServerPayload(deviceId, data);
  } catch {
    /* offline or server unavailable */
  }
}

export async function pushReadingToServer(deviceId: string): Promise<void> {
  if (!isOnline()) return;

  const events = await listReadEventsClient(deviceId);
  for (const event of events) {
    if (event.notificationId.startsWith("absent:")) continue;
    try {
      await fetch("/api/reading/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: event.deviceId,
          notificationId: event.notificationId,
          shownAt: event.shownAt,
          readAt: event.readAt,
          hour: event.hour,
          verseRef: event.verseRef,
          theme: event.theme,
          themeLabel: event.themeLabel,
          locale: event.locale,
          timezone: event.timezone,
        }),
      });
    } catch {
      break;
    }
  }
}

export async function generateDueReportsClient(
  deviceId: string,
  now = new Date(),
): Promise<number> {
  const meta = await getDeviceMetaClient(deviceId);
  if (!meta) return 0;

  const windows = dueReportWindows(now, meta.timezone, meta.startedAt);
  const existing = await listReportsClient(deviceId);
  const existingIds = new Set(existing.map((r) => r.id));
  const events = await listReadEventsClient(deviceId);
  let created = 0;

  for (const window of windows) {
    const id = periodKey(window.unit, window.start, window.end);
    if (existingIds.has(id)) continue;

    const report = generateReportFromEvents(
      deviceId,
      window.unit,
      window.start,
      window.end,
      events,
    );
    if (!report) continue;

    await saveReportClient(report);
    existingIds.add(id);
    created++;
  }

  return created;
}

export async function loadReadingData(
  deviceId: string,
  timezone: string,
  locale: "en" | "sw",
  notifyHours?: number[],
): Promise<{
  meta: Awaited<ReturnType<typeof getDeviceMetaClient>>;
  events: ReadEvent[];
  reports: DevelopmentReport[];
}> {
  await ensureReadingMetaClient(deviceId, timezone, locale, notifyHours);
  await backfillAbsentSlotsClient(deviceId);
  await generateDueReportsClient(deviceId);

  const meta = await getDeviceMetaClient(deviceId);
  const events = await listReadEventsClient(deviceId);
  const reports = await listReportsClient(deviceId);

  if (isOnline()) {
    void (async () => {
      try {
        await pushReadingToServer(deviceId);
        await syncReadingFromServer(deviceId, timezone, locale);
        await backfillAbsentSlotsClient(deviceId);
      } catch {
        /* sync when back online */
      }
    })();
  }

  return { meta, events, reports };
}

export async function generateCustomReportClient(
  deviceId: string,
  start: number,
  end: number,
  timezone: string,
  locale: "en" | "sw",
): Promise<DevelopmentReport | null> {
  const meta = await getDeviceMetaClient(deviceId);
  if (!meta) return null;

  const clampedStart = Math.max(start, meta.startedAt);
  const events = await listReadEventsClient(deviceId);
  const report = generateReportFromEvents(
    deviceId,
    "custom",
    clampedStart,
    end,
    events,
  );
  if (!report) return null;

  await saveReportClient(report);

  if (isOnline()) {
    try {
      await fetch("/api/reading/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          start: clampedStart,
          end,
          unit: "custom" satisfies ReportUnit,
          locale,
          timezone,
        }),
      });
    } catch {
      /* saved locally */
    }
  }

  return report;
}

export async function saveReportNoteClient(
  deviceId: string,
  reportId: string,
  note: string,
): Promise<boolean> {
  const report = (await listReportsClient(deviceId)).find((r) => r.id === reportId);
  if (!report) return false;

  report.note = note.trim() || null;
  report.submittedAt = Date.now();
  await saveReportClient(report);

  if (isOnline()) {
    try {
      const res = await fetch(
        `/api/reading/reports/${encodeURIComponent(reportId)}/note`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, note }),
        },
      );
      return res.ok;
    } catch {
      return true;
    }
  }

  return true;
}
