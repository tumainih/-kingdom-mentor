/** Inlined into public/sw.js — hourly verse notifications + Web Push */
const NOTIFICATION_STATE_URL = "/__kingdom_notification_state__";

let verseTimer = null;

function msUntilNextHour() {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return Math.max(5000, next.getTime() - now.getTime());
}

function currentHour() {
  return new Date().getHours();
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

async function loadHourlyVerse(locale, hour) {
  const scheduleRes = await cacheFirst(new Request("/data/hourly-schedule.json"));
  if (!scheduleRes || !scheduleRes.ok) return null;
  const schedule = await scheduleRes.json();
  const slot = schedule.find((s) => s.hour === hour);
  if (!slot) return null;

  const poolRes = await cacheFirst(new Request("/data/pools/" + slot.theme + ".json"));
  if (!poolRes || !poolRes.ok) return null;
  const pool = await poolRes.json();
  if (!pool.refs?.length) return null;

  const date = localDateString();
  const seed = slot.theme + ":" + date + ":" + hour;
  const scheduledRef = pool.refs[pickPoolIndex(seed, pool.refs.length)];

  const bibleFile = locale === "sw" ? "swahili-index.json" : "kjv-index.json";
  const bibleRes = await cacheFirst(new Request("/data/" + bibleFile));
  if (!bibleRes || !bibleRes.ok) return null;
  const verses = await bibleRes.json();
  const passage = findVerseInIndex(verses, scheduledRef, locale);
  if (!passage) return null;

  const labels = {
    love: { en: "Love", sw: "Upendo" },
    hope: { en: "Hope", sw: "Matumaini" },
    faith: { en: "Faith", sw: "Imani" },
    security: { en: "Security", sw: "Usalama" },
    forgiveness: { en: "Forgiveness", sw: "Msamaha" },
    strength: { en: "Strength", sw: "Nguvu" },
    wisdom: { en: "Wisdom", sw: "Hekima" },
    joy: { en: "Joy", sw: "Furaha" },
    trust: { en: "Trust", sw: "Kuamini" },
    grace: { en: "Grace", sw: "Neema" },
    mercy: { en: "Mercy", sw: "Rehema" },
    comfort: { en: "Comfort", sw: "Faraja" },
    courage: { en: "Courage", sw: "Ujasiri" },
    guidance: { en: "Guidance", sw: "Mwongozo" },
    patience: { en: "Patience", sw: "Subira" },
    peace: { en: "Peace", sw: "Amani" },
  };

  return {
    hour,
    theme: slot.theme,
    themeLabel: labels[slot.theme]?.[locale] || slot.theme,
    scheduledRef,
    passage,
  };
}

function hashSeed(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickPoolIndex(seed, length) {
  if (length <= 0) return 0;
  return hashSeed(seed) % length;
}

function localDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function normalizeRef(ref) {
  return ref.replace(/^Psalm\b/, "Psalms").replace(/\s+/g, " ").trim();
}

function findVerseInIndex(verses, ref, locale) {
  const normalized = normalizeRef(ref);
  if (locale === "sw") {
    const byEn = verses.find((v) => v.refEn === normalized || v.refEn === ref);
    if (byEn) return { ref: byEn.ref, text: byEn.text, refEn: byEn.refEn };
  }
  const hit = verses.find((v) => v.ref === normalized || v.ref === ref);
  return hit ? { ref: hit.ref, text: hit.text, refEn: hit.refEn } : null;
}

function shouldNotifyHour(state, hour) {
  if (!state?.notifyHours?.length) return true;
  return state.notifyHours.includes(hour);
}

async function showHourlyVerseNotification(locale, hourOverride, notifyHours, force) {
  if (!self.registration?.showNotification) return false;
  if (self.Notification?.permission && self.Notification.permission !== "granted") {
    return false;
  }

  const hour = typeof hourOverride === "number" ? hourOverride : currentHour();
  const state = await readNotificationState();
  const hours = notifyHours ?? state?.notifyHours ?? [];
  if (!force && hours.length && !hours.includes(hour)) return false;

  const entry = await loadHourlyVerse(locale, hour);
  if (!entry?.passage?.text) return false;

  const ref = entry.passage.ref;
  const title = entry.themeLabel ? entry.themeLabel + " · " + ref : ref;
  const body = entry.passage.text.length > 180
    ? entry.passage.text.slice(0, 177) + "…"
    : entry.passage.text;

  await self.registration.showNotification("Kingdom AI", {
    body: title + "\n\n" + body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "kingdom-hour-" + hour,
    renotify: true,
    silent: false,
    vibrate: [180, 90, 180],
    data: { url: "/notifications", locale, hour },
  });
  return true;
}

function clearVerseTimer() {
  if (verseTimer !== null) {
    clearTimeout(verseTimer);
    verseTimer = null;
  }
}

async function scheduleHourlyNotification(locale, notifyHours, delayMs) {
  clearVerseTimer();
  const wait = delayMs ?? msUntilNextHour();
  const nextAt = Date.now() + wait;
  await writeNotificationState({
    enabled: true,
    locale,
    notifyHours: notifyHours ?? [],
    nextAt,
    lastHour: currentHour(),
  });

  verseTimer = setTimeout(async () => {
    try {
      const state = await readNotificationState();
      if (!state?.enabled) return;
      const hour = currentHour();
      if (shouldNotifyHour(state, hour)) {
        await showHourlyVerseNotification(state.locale || locale, hour, state.notifyHours);
      }
      await scheduleHourlyNotification(state.locale || locale, state.notifyHours);
    } catch {
      /* resume on activate */
    }
  }, wait);
}

async function stopHourlyNotifications() {
  clearVerseTimer();
  await writeNotificationState({
    enabled: false,
    locale: "en",
    notifyHours: [],
    nextAt: 0,
    lastHour: -1,
  });
}

async function resumeHourlyNotifications() {
  const state = await readNotificationState();
  if (!state?.enabled) return;

  const hour = currentHour();
  if (state.lastHour !== hour && shouldNotifyHour(state, hour)) {
    await showHourlyVerseNotification(state.locale || "en", hour, state.notifyHours);
    await writeNotificationState({ ...state, lastHour: hour });
  }

  const now = Date.now();
  if (state.nextAt && state.nextAt <= now) {
    await scheduleHourlyNotification(state.locale || "en", state.notifyHours);
    return;
  }

  const delay = state.nextAt ? Math.max(1000, state.nextAt - now) : msUntilNextHour();
  await scheduleHourlyNotification(state.locale || "en", state.notifyHours, delay);
}

self.addEventListener("push", (event) => {
  let payload = { title: "Kingdom AI", body: "Scripture for this hour.", url: "/notifications" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* use defaults */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Kingdom AI", {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "kingdom-hour-push",
      renotify: true,
      silent: false,
      vibrate: [180, 90, 180],
      data: { url: payload.url || "/notifications", hour: payload.hour, locale: payload.locale },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/notifications";
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

  if (data.type === "START_HOURLY_NOTIFICATIONS") {
    event.waitUntil(
      (async () => {
        await scheduleHourlyNotification(
          data.locale || "en",
          data.notifyHours || [],
          data.delayMs,
        );
        if (data.showNow) {
          await showHourlyVerseNotification(
            data.locale || "en",
            currentHour(),
            data.notifyHours || [],
            true,
          );
        }
      })(),
    );
    return;
  }

  if (data.type === "STOP_HOURLY_NOTIFICATIONS") {
    event.waitUntil(stopHourlyNotifications());
    return;
  }

  if (data.type === "SHOW_HOUR_VERSE") {
    event.waitUntil(
      (async () => {
        const shown = await showHourlyVerseNotification(
          data.locale || "en",
          data.hour,
          data.notifyHours || [],
          data.force === true,
        );
        if (data.replyPort && event.ports?.[0]) {
          event.ports[0].postMessage({ shown });
        }
      })(),
    );
  }
});
