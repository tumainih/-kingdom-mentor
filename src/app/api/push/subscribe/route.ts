import { NextResponse } from "next/server";
import { parseLocale } from "@/lib/bible/locale";
import { ensureDeviceMeta } from "@/lib/reading/store.server";
import {
  removePushSubscription,
  savePushSubscription,
  type PushSubscriptionRecord,
} from "@/lib/push/store";

export const runtime = "nodejs";

interface SubscribeBody {
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  locale?: unknown;
  timezone?: string;
  notifyHours?: number[];
  deviceId?: string;
}

function parseNotifyHours(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((h) => Number(h))
    .filter((h) => Number.isInteger(h) && h >= 0 && h <= 23);
}

export async function POST(request: Request) {
  const body = (await request.json()) as SubscribeBody;
  const endpoint = body.subscription?.endpoint;
  const p256dh = body.subscription?.keys?.p256dh;
  const auth = body.subscription?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  const locale = parseLocale(body.locale);
  const timezone =
    body.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";

  if (deviceId) {
    await ensureDeviceMeta(deviceId, timezone, locale);
  }

  const record: PushSubscriptionRecord = {
    endpoint,
    keys: { p256dh, auth },
    locale,
    timezone,
    notifyHours: parseNotifyHours(body.notifyHours),
    deviceId: deviceId || undefined,
    createdAt: new Date().toISOString(),
  };

  await savePushSubscription(record);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { endpoint?: string };
  if (!body.endpoint) {
    return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  }
  await removePushSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
