import "@/lib/bible/init-server";
import { getHourlyVerse } from "@/lib/bible/get-hourly-verse";
import type { BibleLocale } from "@/lib/bible/locale";
import {
  listPushSubscriptions,
  localDateKeyInTimezone,
  localHourInTimezone,
  localMinuteInTimezone,
  markPushSent,
  type PushSubscriptionRecord,
  wasPushSent,
} from "@/lib/push/store";
import { ensureWebPush, webpush } from "@/lib/push/vapid";

export interface HourlyPushPayload {
  title: string;
  body: string;
  url: string;
  hour: number;
  locale: BibleLocale;
  type: string;
  verseRef: string;
  theme: string;
  themeLabel: string;
  verseText: string;
}

export async function buildHourlyPushPayload(
  hour: number,
  locale: BibleLocale,
): Promise<HourlyPushPayload | null> {
  const result = await getHourlyVerse(locale, hour);
  if (!result.passage?.text) return null;

  const ref = result.passage.ref;
  const title = `${result.themeLabel} · ${ref}`;
  const text =
    result.passage.text.length > 220
      ? `${result.passage.text.slice(0, 217)}…`
      : result.passage.text;

  return {
    title: "Kingdom AI",
    body: `${title}\n\n${text}`,
    url: `/notifications?hour=${hour}`,
    hour,
    locale,
    type: "verse",
    verseRef: ref,
    theme: result.theme,
    themeLabel: result.themeLabel,
    verseText: result.passage.text,
  };
}

function shouldNotifySub(sub: PushSubscriptionRecord, hour: number): boolean {
  if (!sub.notifyHours?.length) return true;
  return sub.notifyHours.includes(hour);
}

export async function sendHourlyVersePush(): Promise<{
  sent: number;
  skipped: number;
  errors: number;
}> {
  if (!ensureWebPush()) {
    return { sent: 0, skipped: 0, errors: 0 };
  }

  const subs = await listPushSubscriptions();
  const now = new Date();
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const sub of subs) {
    const hour = localHourInTimezone(sub.timezone, now);
    const minute = localMinuteInTimezone(sub.timezone, now);
    if (minute > 15) {
      skipped++;
      continue;
    }

    if (!shouldNotifySub(sub, hour)) {
      skipped++;
      continue;
    }

    const day = localDateKeyInTimezone(sub.timezone, now);
    const slotKey = `${day}:${hour}`;
    if (sub.deviceId && (await wasPushSent(sub.deviceId, slotKey))) {
      skipped++;
      continue;
    }

    const payload = await buildHourlyPushPayload(hour, sub.locale);
    if (!payload) {
      skipped++;
      continue;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url,
          hour: payload.hour,
          locale: payload.locale,
          type: "verse",
          verseRef: payload.verseRef,
          theme: payload.theme,
          themeLabel: payload.themeLabel,
          verseText: payload.verseText,
          deviceId: sub.deviceId,
          timezone: sub.timezone,
        }),
        {
          TTL: 3600,
          urgency: "high",
        },
      );
      if (sub.deviceId) await markPushSent(sub.deviceId, slotKey);
      sent++;
    } catch (err) {
      errors++;
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        const { removePushSubscription } = await import("@/lib/push/store");
        await removePushSubscription(sub.endpoint);
      }
    }
  }

  return { sent, skipped, errors };
}
