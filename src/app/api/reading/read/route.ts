import { NextResponse } from "next/server";
import { parseLocale } from "@/lib/bible/locale";
import { buildReadEvent, generateDueReportsForDevice } from "@/lib/reading/reports";
import {
  ensureDeviceMeta,
  removePendingNotification,
  saveReadEvent,
} from "@/lib/reading/store.server";

export const runtime = "nodejs";

interface ReadBody {
  deviceId?: string;
  notificationId?: string;
  shownAt?: number;
  readAt?: number;
  hour?: number;
  verseRef?: string;
  theme?: string;
  themeLabel?: string;
  locale?: unknown;
  timezone?: string;
  isTest?: boolean;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ReadBody;
  const deviceId = body.deviceId?.trim();
  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId." }, { status: 400 });
  }

  const shownAt = Number(body.shownAt);
  const readAt = Number(body.readAt) || Date.now();
  if (!Number.isFinite(shownAt)) {
    return NextResponse.json({ error: "Invalid shownAt." }, { status: 400 });
  }

  const locale = parseLocale(body.locale);
  const timezone = body.timezone?.trim() || "UTC";
  await ensureDeviceMeta(deviceId, timezone, locale);

  const notificationId = body.notificationId || `n-${readAt}`;
  const event = buildReadEvent({
    deviceId,
    notificationId,
    shownAt,
    readAt,
    hour: Number.isFinite(Number(body.hour)) ? Number(body.hour) : new Date(readAt).getHours(),
    verseRef: body.verseRef || "",
    theme: body.theme || "",
    themeLabel: body.themeLabel || "",
    locale,
    timezone,
    missed: false,
  });

  await saveReadEvent(event);
  await removePendingNotification(deviceId, notificationId);
  await generateDueReportsForDevice(deviceId, new Date(readAt));

  return NextResponse.json({ ok: true, event });
}
