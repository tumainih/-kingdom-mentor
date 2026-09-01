/* Kingdom AI — offline-capable service worker (build CbLxu5e5nCsvPupcaf6Nb) */
const CACHE = "kingdom-ai-CbLxu5e5nCsvPupcaf6Nb";
const PRECACHE = [
  "/",
  "/home",
  "/history",
  "/areas",
  "/notifications",
  "/install",
  "/manifest.webmanifest",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/data/hourly-schedule.json",
  "/data/hourly-en.json",
  "/data/hourly-sw.json",
  "/data/kjv-index.json",
  "/data/swahili-index.json",
  "/data/pools/anger.json",
  "/data/pools/comfort.json",
  "/data/pools/courage.json",
  "/data/pools/doubt.json",
  "/data/pools/faith.json",
  "/data/pools/fear.json",
  "/data/pools/forgiveness.json",
  "/data/pools/grace.json",
  "/data/pools/grief.json",
  "/data/pools/guidance.json",
  "/data/pools/guilt.json",
  "/data/pools/hope.json",
  "/data/pools/index.json",
  "/data/pools/joy.json",
  "/data/pools/love.json",
  "/data/pools/marriage.json",
  "/data/pools/mercy.json",
  "/data/pools/patience.json",
  "/data/pools/peace.json",
  "/data/pools/prayer.json",
  "/data/pools/security.json",
  "/data/pools/strength.json",
  "/data/pools/trust.json",
  "/data/pools/wisdom.json",
  "/_next/static/CbLxu5e5nCsvPupcaf6Nb/_buildManifest.js",
  "/_next/static/CbLxu5e5nCsvPupcaf6Nb/_clientMiddlewareManifest.js",
  "/_next/static/CbLxu5e5nCsvPupcaf6Nb/_ssgManifest.js",
  "/_next/static/chunks/0cz1d0mv5g_q7.js",
  "/_next/static/chunks/0ehjiuuxbbhq9.js",
  "/_next/static/chunks/1g179lcifdq15.js",
  "/_next/static/chunks/1g39-lg_ukhpm.js",
  "/_next/static/chunks/1hsi7i8_qoc6w.js",
  "/_next/static/chunks/1uj543fzv0-to.js",
  "/_next/static/chunks/1z99mlp5cofct.js",
  "/_next/static/chunks/22yo5plex5kpv.js",
  "/_next/static/chunks/24ihfyt9kr7mm.js",
  "/_next/static/chunks/24t7crwozt_yd.js",
  "/_next/static/chunks/271y7z0stpu_5.js",
  "/_next/static/chunks/2w4fbwkoiy-9y.js",
  "/_next/static/chunks/34kmwrswtbn9a.css",
  "/_next/static/chunks/373skgu07-_06.js",
  "/_next/static/chunks/3adwt13tezgym.js",
  "/_next/static/chunks/3q576hlfnuh0n.js",
  "/_next/static/chunks/3s5czxwxtdlak.js",
  "/_next/static/chunks/turbopack-0snm50y8kpj5e.js",
  "/_next/static/media/1bffadaabf893a1e-s.3-6t-g6q0vh0a.woff2",
  "/_next/static/media/2bbe8d2671613f1f-s.0k62hbripvv8p.woff2",
  "/_next/static/media/2c55a0e60120577a-s.0-dom-5bn10r2.woff2",
  "/_next/static/media/507a47c1876d4ec2-s.2qdkzeru_ecot.woff2",
  "/_next/static/media/5476f68d60460930-s.2uwcyprjm3xu3.woff2",
  "/_next/static/media/71fbf9c08529c2a5-s.2fpqrm51ez0iq.woff2",
  "/_next/static/media/83afe278b6a6bb3c-s.p.2bn3s6zvc0dyp.woff2",
  "/_next/static/media/8c2eb9ceedecfc8e-s.p.23aeddxv5enbo.woff2",
  "/_next/static/media/9c72aa0f40e4eef8-s.1y4-pdgsjb-pw.woff2",
  "/_next/static/media/ac34884600cd8d5d-s.2936i88_6qsfd.woff2",
  "/_next/static/media/ad66f9afd8947f86-s.3lvt2whj97whp.woff2",
  "/_next/static/media/e1ccd2766b08c828-s.15gdzqknx46iu.woff2",
  "/_next/static/media/e7150917543fc9da-s.0mybutugvu-lq.woff2",
  "/_next/static/media/e9457141811d41ae-s.02frcczqg7k-8.woff2",
  "/_next/static/media/favicon.2vob68tjqpejf.ico",
  "/_next/static/media/icon.1v5cwft9ue97g.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()).then(() => resumeHourlyNotifications()),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === "GET") {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      return (await caches.match("/home")) || (await caches.match("/")) || Response.error();
    }
    return Response.error();
  }
}

async function navigateWithOfflineFallback(request) {
  const cached = await caches.match(request);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (cached) return cached;
    return (
      (await caches.match("/home")) ||
      (await caches.match("/")) ||
      Response.error()
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/data/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith("/api/hourly-verse")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(navigateWithOfflineFallback(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

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

async function showHourlyVerseNotification(locale, hourOverride, notifyHours) {
  if (!self.registration?.showNotification) return false;
  if (self.Notification?.permission && self.Notification.permission !== "granted") {
    return false;
  }

  const hour = typeof hourOverride === "number" ? hourOverride : currentHour();
  const state = await readNotificationState();
  const hours = notifyHours ?? state?.notifyHours ?? [];
  if (hours.length && !hours.includes(hour)) return false;

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
        if (data.showNow && shouldNotifyHour({ notifyHours: data.notifyHours || [] }, currentHour())) {
          await showHourlyVerseNotification(data.locale || "en", currentHour(), data.notifyHours || []);
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
      showHourlyVerseNotification(data.locale || "en", data.hour, data.notifyHours || []),
    );
  }
});

