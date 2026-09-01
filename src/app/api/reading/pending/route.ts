import { NextResponse } from "next/server";
import { parseLocale } from "@/lib/bible/locale";
import { hourEndsAtMs } from "@/lib/reading/rates";
import { ensureDeviceMeta, savePendingNotification } from "@/lib/reading/store.server";
import type { PendingNotification } from "@/lib/reading/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<PendingNotification>;
  const deviceId = body.deviceId?.trim();
  const notificationId = body.notificationId?.trim();
  const shownAt = Number(body.shownAt);

  if (!deviceId || !notificationId || !Number.isFinite(shownAt)) {
    return NextResponse.json({ error: "Invalid pending payload." }, { status: 400 });
  }

  const locale = parseLocale(body.locale);
  const timezone = body.timezone?.trim() || "UTC";
  await ensureDeviceMeta(deviceId, timezone, locale);

  const hour = typeof body.hour === "number" ? body.hour : new Date(shownAt).getHours();
  const pending: PendingNotification = {
    notificationId,
    deviceId,
    shownAt,
    hour,
    hourEndsAt: hourEndsAtMs(shownAt, timezone),
    verseRef: body.verseRef || "",
    theme: body.theme || "",
    themeLabel: body.themeLabel || "",
    locale,
    timezone,
    isTest: Boolean(body.isTest),
  };

  await savePendingNotification(pending);
  return NextResponse.json({ ok: true });
}
