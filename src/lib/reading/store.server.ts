import { Redis } from "@upstash/redis";
import type {
  DeviceReadingMeta,
  DevelopmentReport,
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
): Promise<DeviceReadingMeta> {
  const redis = redisClient();
  const existing = await getDeviceMeta(deviceId);
  if (existing) return existing;

  const meta: DeviceReadingMeta = {
    deviceId,
    startedAt: Date.now(),
    timezone,
    locale,
  };

  if (redis) {
    await redis.set(metaKey(deviceId), meta);
    await trackDevice(deviceId);
  }
  return meta;
}

export async function saveReadEvent(event: ReadEvent): Promise<void> {
  const redis = redisClient();
  await ensureDeviceMeta(event.deviceId, event.timezone, event.locale);
  if (!redis) return;

  const events = (await redis.get<ReadEvent[]>(eventsKey(event.deviceId))) ?? [];
  if (events.some((e) => e.id === event.id)) return;
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
  return (reports ?? []).sort((a, b) => b.generatedAt - a.generatedAt);
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
  return events.filter((e) => e.readAt >= start && e.readAt <= end);
}
