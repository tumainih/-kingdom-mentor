import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Redis } from "@upstash/redis";

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  locale: "en" | "sw";
  timezone: string;
  notifyHours: number[];
  createdAt: string;
}

const REDIS_KEY = "kingdom:push-subscriptions";
const FILE_PATH = path.join(process.cwd(), "data", "push-subscriptions.json");

function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function readFileSubs(): Promise<PushSubscriptionRecord[]> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    return JSON.parse(raw) as PushSubscriptionRecord[];
  } catch {
    return [];
  }
}

async function writeFileSubs(subs: PushSubscriptionRecord[]): Promise<void> {
  await mkdir(path.dirname(FILE_PATH), { recursive: true });
  await writeFile(FILE_PATH, JSON.stringify(subs, null, 2));
}

export async function listPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const redis = redisClient();
  if (redis) {
    const raw = await redis.get<PushSubscriptionRecord[]>(REDIS_KEY);
    return raw ?? [];
  }
  return readFileSubs();
}

export async function savePushSubscription(
  record: PushSubscriptionRecord,
): Promise<void> {
  const redis = redisClient();
  const subs = await listPushSubscriptions();
  const next = subs.filter((s) => s.endpoint !== record.endpoint);
  next.push(record);

  if (redis) {
    await redis.set(REDIS_KEY, next);
    return;
  }
  await writeFileSubs(next);
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const redis = redisClient();
  const subs = (await listPushSubscriptions()).filter(
    (s) => s.endpoint !== endpoint,
  );

  if (redis) {
    await redis.set(REDIS_KEY, subs);
    return;
  }
  await writeFileSubs(subs);
}

export function localHourInTimezone(timezone: string, at = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      hourCycle: "h23",
      timeZone: timezone,
    }).format(at),
  );
}

export function localMinuteInTimezone(timezone: string, at = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      minute: "numeric",
      timeZone: timezone,
    }).format(at),
  );
}
