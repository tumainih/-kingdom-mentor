import { idbGet, idbGetByIndex, idbPut } from "@/lib/reading/idb";
import type { DeviceReadingMeta, DevelopmentReport, ReadEvent } from "@/lib/reading/types";

export async function getDeviceMetaClient(
  deviceId: string,
): Promise<DeviceReadingMeta | null> {
  try {
    return (await idbGet<DeviceReadingMeta>("meta", deviceId)) ?? null;
  } catch {
    return null;
  }
}

export async function ensureDeviceMetaClient(
  deviceId: string,
  timezone: string,
  locale: "en" | "sw",
  notifyHours?: number[],
): Promise<DeviceReadingMeta> {
  const existing = await getDeviceMetaClient(deviceId);
  if (existing) {
    if (notifyHours?.length) {
      existing.notifyHours = notifyHours;
      await idbPut("meta", existing);
    }
    return existing;
  }

  const meta: DeviceReadingMeta = {
    deviceId,
    startedAt: Date.now(),
    timezone,
    locale,
    notifyHours: notifyHours?.length ? notifyHours : undefined,
  };
  await idbPut("meta", meta);
  return meta;
}

export async function listReadEventsClient(deviceId: string): Promise<ReadEvent[]> {
  try {
    return await idbGetByIndex<ReadEvent>("events", "deviceId", deviceId);
  } catch {
    return [];
  }
}

export async function saveReadEventClient(event: ReadEvent): Promise<void> {
  try {
    const existing = await idbGetByIndex<ReadEvent>(
      "events",
      "notificationId",
      event.notificationId,
    );
    if (existing.some((e) => e.deviceId === event.deviceId)) return;
    await idbPut("events", event);
  } catch {
    /* storage full or unavailable */
  }
}

export async function listReportsClient(deviceId: string): Promise<DevelopmentReport[]> {
  try {
    const reports = await idbGetByIndex<DevelopmentReport>("reports", "deviceId", deviceId);
    return reports.sort((a, b) => b.generatedAt - a.generatedAt);
  } catch {
    return [];
  }
}

export async function saveReportClient(report: DevelopmentReport): Promise<void> {
  try {
    await idbPut("reports", report);
  } catch {
    /* best-effort */
  }
}

export async function getReportClient(
  deviceId: string,
  reportId: string,
): Promise<DevelopmentReport | null> {
  const reports = await listReportsClient(deviceId);
  return reports.find((r) => r.id === reportId) ?? null;
}
