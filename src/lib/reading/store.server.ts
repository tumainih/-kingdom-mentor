import { Redis } from "@upstash/redis";
import type {
  DeviceReadingMeta,
  DevelopmentReport,
  PendingNotification,
  ReadEvent,
} from "@/lib/reading/types";

const DEVICES_KEY = "kingdom:reading:devices";

function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function eventsKey(deviceId: string) {
  return `kingdom:reading:${deviceId}:events`;
}

function reportsKey(deviceId: string) {
  return `kingdom:reading:${deviceId}:reports`;
}

function metaKey(deviceId: string) {
  return `kingdom:reading:${deviceId}:meta`;
}

export async function listReadingDeviceIds(): Promise<string[]> {
  const redis = redisClient();
  if (!redis) return [];
  const raw = await redis.get<string[]>(DEVICES_KEY);
  return raw ?? [];
}

async function trackDevice(deviceId: string): Promise<void> {
  const redis = redisClient();
  if (!redis) return;
  const ids = await listReadingDeviceIds();
  if (!ids.includes(deviceId)) {
    await redis.set(DEVICES_KEY, [...ids, deviceId]);
  }
}

export async function getDeviceMeta(
  deviceId: string,
): Promise<DeviceReadingMeta | null> {
  const redis = redisClient();
  if (!redis) return null;
  return redis.get<DeviceReadingMeta>(metaKey(deviceId));
}

export async function ensureDeviceMeta(
  deviceId: string,
  timezone: string,
  locale: "en" | "sw",
  notifyHours?: number[],
): Promise<DeviceReadingMeta> {
  const redis = redisClient();
  const existing = await getDeviceMeta(deviceId);
  if (existing) {
    if (notifyHours?.length) {
      existing.notifyHours = notifyHours;
      if (redis) await redis.set(metaKey(deviceId), existing);
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

  if (redis) {
    await redis.set(metaKey(deviceId), meta);
    await trackDevice(deviceId);
  }
  return meta;
}

export async function updateDeviceNotifyHours(
  deviceId: string,
  notifyHours: number[],
): Promise<void> {
  const redis = redisClient();
  const meta = await getDeviceMeta(deviceId);
  if (!meta) return;
  meta.notifyHours = notifyHours;
  if (redis) await redis.set(metaKey(deviceId), meta);
}

function pendingKey(deviceId: string) {
  return `kingdom:reading:${deviceId}:pending`;
}

export async function listPendingNotifications(
  deviceId: string,
): Promise<PendingNotification[]> {
  const redis = redisClient();
  if (!redis) return [];
  return (await redis.get<PendingNotification[]>(pendingKey(deviceId))) ?? [];
}

export async function savePendingNotification(
  pending: PendingNotification,
): Promise<void> {
  const redis = redisClient();
  await ensureDeviceMeta(pending.deviceId, pending.timezone, pending.locale);
  if (!redis) return;

  const list = await listPendingNotifications(pending.deviceId);
  const next = list.filter((p) => p.notificationId !== pending.notificationId);
  next.push(pending);
  await redis.set(pendingKey(pending.deviceId), next);
  await trackDevice(pending.deviceId);
}

export async function removePendingNotification(
  deviceId: string,
  notificationId: string,
): Promise<void> {
  const redis = redisClient();
  if (!redis) return;
  const list = await listPendingNotifications(deviceId);
  await redis.set(
    pendingKey(deviceId),
    list.filter((p) => p.notificationId !== notificationId),
  );
}

export async function listAllPendingNotifications(): Promise<PendingNotification[]> {
  const ids = await listReadingDeviceIds();
  const all: PendingNotification[] = [];
  for (const id of ids) {
    all.push(...(await listPendingNotifications(id)));
  }
  return all;
}

export async function saveReadEvent(event: ReadEvent): Promise<void> {
  const redis = redisClient();
  await ensureDeviceMeta(event.deviceId, event.timezone, event.locale);
  await removePendingNotification(event.deviceId, event.notificationId);
  if (!redis) return;

  const events = (await redis.get<ReadEvent[]>(eventsKey(event.deviceId))) ?? [];
  if (events.some((e) => e.id === event.id || e.notificationId === event.notificationId)) return;
  events.push(event);
  await redis.set(eventsKey(event.deviceId), events);
  await trackDevice(event.deviceId);
}

export async function listReadEvents(deviceId: string): Promise<ReadEvent[]> {
  const redis = redisClient();
  if (!redis) return [];
  const events = await redis.get<ReadEvent[]>(eventsKey(deviceId));
  return events ?? [];
}

export async function listReports(deviceId: string): Promise<DevelopmentReport[]> {
  const redis = redisClient();
  if (!redis) return [];
  const reports = await redis.get<DevelopmentReport[]>(reportsKey(deviceId));
  return (reports ?? []).sort((a, b) => b.periodEnd - a.periodEnd || b.periodStart - a.periodStart);
}

export async function getReport(
  deviceId: string,
  reportId: string,
): Promise<DevelopmentReport | null> {
  const reports = await listReports(deviceId);
  return reports.find((r) => r.id === reportId) ?? null;
}

export async function saveReport(report: DevelopmentReport): Promise<void> {
  const redis = redisClient();
  if (!redis) return;

  const reports = await listReports(report.deviceId);
  const idx = reports.findIndex((r) => r.id === report.id);
  if (idx >= 0) reports[idx] = report;
  else reports.push(report);
  await redis.set(reportsKey(report.deviceId), reports);
  await trackDevice(report.deviceId);
}

export async function reportExists(
  deviceId: string,
  reportId: string,
): Promise<boolean> {
  const reports = await listReports(deviceId);
  return reports.some((r) => r.id === reportId);
}

export async function eventsInRange(
  deviceId: string,
  start: number,
  end: number,
): Promise<ReadEvent[]> {
  const events = await listReadEvents(deviceId);
  return events.filter(
    (e) =>
      (e.shownAt >= start && e.shownAt <= end) ||
      (e.readAt >= start && e.readAt <= end),
  );
}
