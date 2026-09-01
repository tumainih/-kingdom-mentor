/** Inlined into public/sw.js by scripts/generate-sw.mjs */
const VERSE_INTERVAL_MS = 15 * 60 * 1000;
const NOTIFICATION_STATE_URL = "/__kingdom_notification_state__";

let verseTimer = null;

function slotForDate(date) {
  return Math.floor((date.getHours() * 60 + date.getMinutes()) / 15) % 96;
}

async function readNotificationState() {
  try {
    const cache = await caches.open(CACHE);
    const res = await cache.match(NOTIFICATION_STATE_URL);
    if (!res) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function writeNotificationState(state) {
  const cache = await caches.open(CACHE);
  await cache.put(
    NOTIFICATION_STATE_URL,
    new Response(JSON.stringify(state), {
      headers: { "Content-Type": "application/json" },
    }),
  );
}

async function loadNotificationVerse(locale, slot) {
  const url = "/data/notification-" + locale + ".json";
  const res = await cacheFirst(new Request(url));
  if (!res || !res.ok) return null;
  const slots = await res.json();
  if (!Array.isArray(slots) || slots.length === 0) return null;
  return slots[slot % slots.length] ?? null;
}

async function showVerseNotification(locale, slotOverride) {
  if (!self.registration?.showNotification) return false;
  const permission = self.Notification?.permission;
  if (permission && permission !== "granted") return false;

  const slot =
    typeof slotOverride === "number"
      ? slotOverride
      : slotForDate(new Date());
  const entry = await loadNotificationVerse(locale, slot);
  if (!entry?.passage?.text) return false;

  const ref = entry.passage.ref;
  const refEn = entry.passage.refEn;
  const title =
    entry.themeLabel && refEn && refEn !== ref
      ? entry.themeLabel + " · " + ref
      : entry.themeLabel
        ? entry.themeLabel + " · " + ref
        : ref;
  const body = entry.passage.text.length > 180
    ? entry.passage.text.slice(0, 177) + "…"
    : entry.passage.text;

  await self.registration.showNotification("Kingdom AI", {
    body: title + "\n\n" + body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "kingdom-verse-" + slot,
    renotify: true,
    data: { url: "/home", locale, slot },
  });
  return true;
}

function clearVerseTimer() {
  if (verseTimer !== null) {
    clearTimeout(verseTimer);
    verseTimer = null;
  }
}

async function scheduleVerseNotification(locale, delayMs) {
  clearVerseTimer();
  const wait = Math.max(5000, delayMs ?? VERSE_INTERVAL_MS);
  const nextAt = Date.now() + wait;
  await writeNotificationState({ enabled: true, locale, nextAt });

  verseTimer = setTimeout(async () => {
    try {
      const state = await readNotificationState();
      if (!state?.enabled) return;
      await showVerseNotification(state.locale || locale);
      await scheduleVerseNotification(state.locale || locale, VERSE_INTERVAL_MS);
    } catch {
      /* retry on next activate */
    }
  }, wait);
}

async function stopVerseNotifications() {
  clearVerseTimer();
  await writeNotificationState({ enabled: false, locale: "en", nextAt: 0 });
}

async function resumeVerseNotifications() {
  const state = await readNotificationState();
  if (!state?.enabled) return;

  const now = Date.now();
  if (state.nextAt && state.nextAt <= now) {
    await showVerseNotification(state.locale || "en");
    await scheduleVerseNotification(state.locale || "en", VERSE_INTERVAL_MS);
    return;
  }

  const delay = state.nextAt ? Math.max(1000, state.nextAt - now) : VERSE_INTERVAL_MS;
  await scheduleVerseNotification(state.locale || "en", delay);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/home";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data === "skipWaiting") {
    self.skipWaiting();
    return;
  }
  if (!data || typeof data !== "object") return;

  if (data.type === "START_VERSE_NOTIFICATIONS") {
    event.waitUntil(
      (async () => {
        await scheduleVerseNotification(data.locale || "en", data.delayMs ?? VERSE_INTERVAL_MS);
        if (data.showNow) await showVerseNotification(data.locale || "en");
      })(),
    );
    return;
  }

  if (data.type === "STOP_VERSE_NOTIFICATIONS") {
    event.waitUntil(stopVerseNotifications());
    return;
  }

  if (data.type === "SHOW_VERSE_NOW") {
    event.waitUntil(showVerseNotification(data.locale || "en"));
  }
});
