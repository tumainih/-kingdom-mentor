/* Kingdom AI — offline-capable service worker (build S8eBaQTKJdY_Chj4QKR4G) */
const CACHE = "kingdom-ai-S8eBaQTKJdY_Chj4QKR4G";
const PRECACHE = [
  "/",
  "/home",
  "/history",
  "/notifications",
  "/install",
  "/manifest.webmanifest",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/data/hourly-en.json",
  "/data/hourly-sw.json",
  "/_next/static/S8eBaQTKJdY_Chj4QKR4G/_buildManifest.js",
  "/_next/static/S8eBaQTKJdY_Chj4QKR4G/_clientMiddlewareManifest.js",
  "/_next/static/S8eBaQTKJdY_Chj4QKR4G/_ssgManifest.js",
  "/_next/static/chunks/0cz1d0mv5g_q7.js",
  "/_next/static/chunks/0ehjiuuxbbhq9.js",
  "/_next/static/chunks/0u-2edh8m05zc.js",
  "/_next/static/chunks/1ha3d4buospca.js",
  "/_next/static/chunks/1v7kwkh6qox1x.js",
  "/_next/static/chunks/1z99mlp5cofct.js",
  "/_next/static/chunks/24t7crwozt_yd.js",
  "/_next/static/chunks/2g8-9zqrngitm.js",
  "/_next/static/chunks/2usf06h1uchme.css",
  "/_next/static/chunks/2y1nd8vf7h77j.js",
  "/_next/static/chunks/3_qcxdfi4zlnd.js",
  "/_next/static/chunks/3adwt13tezgym.js",
  "/_next/static/chunks/3hhai1xccupwp.js",
  "/_next/static/chunks/3q576hlfnuh0n.js",
  "/_next/static/chunks/40_-th3l4iag_.js",
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
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
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
    event.respondWith(networkFirst(request));
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
  const url = "/data/hourly-" + locale + ".json";
  const res = await cacheFirst(new Request(url));
  if (!res || !res.ok) return null;
  const slots = await res.json();
  if (!Array.isArray(slots)) return null;
  return slots.find((s) => s.hour === hour) ?? null;
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

