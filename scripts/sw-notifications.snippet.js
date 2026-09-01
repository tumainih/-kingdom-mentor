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

function notificationId(isTest) {
  const prefix = isTest ? "test-" : "kn-";
  return prefix + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

function currentSlotKey() {
  return localDateString() + ":" + currentHour();
}

function readActionTitle(locale) {
  return locale === "sw" ? "Nimesoma" : "Read";
}

async function readDeviceId() {
  const state = await readNotificationState();
  return state?.deviceId || null;
}

async function postReadEvent(data, readAt) {
  const shownAt = data.shownAt || readAt;
  const deviceId = data.deviceId || (await readDeviceId());
  if (!deviceId) return;

  try {
    await fetch("/api/reading/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        notificationId: data.notificationId,
        shownAt,
        readAt,
        hour: data.hour,
        verseRef: data.verseRef || "",
        theme: data.theme || "",
        themeLabel: data.themeLabel || "",
        locale: data.locale || "en",
        timezone: data.timezone || "UTC",
      }),
    });
  } catch {
    /* offline — app syncs later */
  }
}

async function postPendingNotification(data, isTest) {
  if (!data.deviceId || !data.notificationId) return;
  try {
    await fetch("/api/reading/pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: data.deviceId,
        notificationId: data.notificationId,
        shownAt: data.shownAt,
        hour: data.hour,
        verseRef: data.verseRef || "",
        theme: data.theme || "",
        themeLabel: data.themeLabel || "",
        locale: data.locale || "en",
        timezone: data.timezone || "UTC",
        isTest: Boolean(isTest),
      }),
    });
  } catch {
    /* offline */
  }
}

async function showHourlyVerseNotification(locale, hourOverride, notifyHours, force, isTest) {
  if (!self.registration?.showNotification) return false;
  if (self.Notification?.permission && self.Notification.permission !== "granted") {
    return false;
  }

  const hour = typeof hourOverride === "number" ? hourOverride : currentHour();
  const state = await readNotificationState();
  const hours = notifyHours ?? state?.notifyHours ?? [];
  if (!force && hours.length && !hours.includes(hour)) return false;

  const slot = currentSlotKey();
  if (!force && !isTest && state?.lastSlot === slot) return false;

  const entry = await loadHourlyVerse(locale, hour);
  if (!entry?.passage?.text) return false;

  const ref = entry.passage.ref;
  const title = entry.themeLabel ? entry.themeLabel + " · " + ref : ref;
  const body = entry.passage.text.length > 180
    ? entry.passage.text.slice(0, 177) + "…"
    : entry.passage.text;
  const shownAt = Date.now();
  const nid = notificationId(isTest);
  const deviceId = state?.deviceId || (await readDeviceId());

  await self.registration.showNotification("Kingdom AI", {
    body: title + "\n\n" + body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "kingdom-hour-" + hour + "-" + nid,
    renotify: true,
    silent: false,
    vibrate: [180, 90, 180],
    requireInteraction: true,
    actions: [{ action: "read", title: readActionTitle(locale) }],
    data: {
      url: "/notifications",
      locale,
      hour,
      type: "verse",
      verseRef: ref,
      theme: entry.theme,
      themeLabel: entry.themeLabel,
      verseText: entry.passage.text,
      shownAt,
      notificationId: nid,
      deviceId,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    },
  });
  await postPendingNotification(
    {
      deviceId,
      notificationId: nid,
      shownAt,
      hour,
      verseRef: ref,
      theme: entry.theme,
      themeLabel: entry.themeLabel,
      locale,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    },
    isTest,
  );
  if (!isTest) {
    await writeNotificationState({
      ...(state || {}),
      lastSlot: slot,
      lastHour: hour,
    });
  }
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
        await showHourlyVerseNotification(state.locale || locale, hour, state.notifyHours, false, false);
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
  const slot = currentSlotKey();
  if (state.lastSlot !== slot && shouldNotifyHour(state, hour)) {
    await showHourlyVerseNotification(state.locale || "en", hour, state.notifyHours, false, false);
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
  let payload = { title: "Kingdom AI", body: "Scripture for this hour.", url: "/notifications", type: "verse" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* use defaults */
  }

  const locale = payload.locale || "en";
  const shownAt = Date.now();
  const nid = notificationId();
  const isReport = payload.type === "report";

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(payload.title || "Kingdom AI", {
        body: payload.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: isReport ? "kingdom-report-" + (payload.reportId || nid) : "kingdom-hour-push-" + nid,
        renotify: true,
        silent: false,
        vibrate: [180, 90, 180],
        requireInteraction: true,
        actions: isReport
          ? [{ action: "open-report", title: locale === "sw" ? "Fungua ripoti" : "Open report" }]
          : [{ action: "read", title: readActionTitle(locale) }],
        data: {
          url: payload.url || (isReport ? "/reports" : "/notifications"),
          hour: payload.hour,
          locale,
          type: payload.type || "verse",
          verseRef: payload.verseRef || "",
          theme: payload.theme || "",
          themeLabel: payload.themeLabel || "",
          verseText: payload.verseText || "",
          reportId: payload.reportId || "",
          deviceId: payload.deviceId || "",
          shownAt,
          notificationId: nid,
          timezone: payload.timezone || "UTC",
        },
      });
      if (payload.type !== "report") {
        await postPendingNotification(
          {
            deviceId: payload.deviceId,
            notificationId: nid,
            shownAt,
            hour: payload.hour,
            verseRef: payload.verseRef || "",
            theme: payload.theme || "",
            themeLabel: payload.themeLabel || "",
            locale,
            timezone: payload.timezone || "UTC",
          },
          false,
        );
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  const data = event.notification.data || {};
  const action = event.action;
  const readAt = Date.now();

  if (action === "read" || (!action && data.type === "verse")) {
    event.notification.close();
    event.waitUntil(
      (async () => {
        await postReadEvent(data, readAt);
      })(),
    );
    return;
  }

  if (action === "open-report" || data.type === "report") {
    event.notification.close();
    const target = data.reportId
      ? "/reports?report=" + encodeURIComponent(data.reportId)
      : data.url || "/reports";
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
      }),
    );
    return;
  }

  event.notification.close();
  const target = data.url || "/notifications";
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
        const prev = await readNotificationState();
        await writeNotificationState({
          ...(prev || {}),
          enabled: true,
          locale: data.locale || "en",
          notifyHours: data.notifyHours || [],
          deviceId: data.deviceId || prev?.deviceId,
        });
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
            true,
          );
        }
      })(),
    );
    return;
  }

  if (data.type === "SET_DEVICE_ID") {
    event.waitUntil(
      (async () => {
        const prev = await readNotificationState();
        await writeNotificationState({
          ...(prev || { enabled: false, locale: "en", notifyHours: [], nextAt: 0, lastHour: -1 }),
          deviceId: data.deviceId,
          timezone: data.timezone,
        });
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
          data.isTest === true,
        );
        if (data.replyPort && event.ports?.[0]) {
          event.ports[0].postMessage({ shown });
        }
      })(),
    );
  }
});
