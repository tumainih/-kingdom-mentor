import "@/lib/bible/init-server";
import { getHourlyVerse } from "@/lib/bible/get-hourly-verse";
import type { BibleLocale } from "@/lib/bible/locale";
import {
  listPushSubscriptions,
  localHourInTimezone,
  type PushSubscriptionRecord,
} from "@/lib/push/store";
import { ensureWebPush, webpush } from "@/lib/push/vapid";

export interface HourlyPushPayload {
  title: string;
  body: string;
  url: string;
  hour: number;
  locale: BibleLocale;
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
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const sub of subs) {
    const hour = localHourInTimezone(sub.timezone);
    if (!shouldNotifySub(sub, hour)) {
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
        }),
        {
          TTL: 3600,
          urgency: "high",
        },
      );
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
