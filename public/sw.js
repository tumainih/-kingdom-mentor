/* Kingdom AI — offline-capable service worker (build szPy3Pa1MS24E1-7nXChS) */
const CACHE = "kingdom-ai-szPy3Pa1MS24E1-7nXChS";
const PRECACHE = [
  "/",
  "/home",
  "/history",
  "/areas",
  "/notifications",
  "/reports",
  "/install",
  "/privacy",
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
  "/_next/static/chunks/04krbzd2lmnmg.js",
  "/_next/static/chunks/09zymofzcq9yo.js",
  "/_next/static/chunks/0ajknyisuvam9.css",
  "/_next/static/chunks/0cz1d0mv5g_q7.js",
  "/_next/static/chunks/0ehjiuuxbbhq9.js",
  "/_next/static/chunks/0gi0fs-foriyd.js",
  "/_next/static/chunks/0pii_50ieyxbh.js",
  "/_next/static/chunks/14e1ow85_mnlp.js",
  "/_next/static/chunks/1cmk72eecyy08.js",
  "/_next/static/chunks/1h0lni661c03r.js",
  "/_next/static/chunks/1ijjdsn2z-ov1.js",
  "/_next/static/chunks/1z99mlp5cofct.js",
  "/_next/static/chunks/24t7crwozt_yd.js",
  "/_next/static/chunks/27m_hem7j38nc.js",
  "/_next/static/chunks/2n612fe5thts9.js",
  "/_next/static/chunks/2ydnron3zbkwf.js",
  "/_next/static/chunks/3adwt13tezgym.js",
  "/_next/static/chunks/3q576hlfnuh0n.js",
  "/_next/static/chunks/3wtl5qdkwgu5z.js",
  "/_next/static/chunks/437ipb-buspo7.js",
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
  "/_next/static/media/icon.1v5cwft9ue97g.svg",
  "/_next/static/szPy3Pa1MS24E1-7nXChS/_buildManifest.js",
  "/_next/static/szPy3Pa1MS24E1-7nXChS/_clientMiddlewareManifest.js",
  "/_next/static/szPy3Pa1MS24E1-7nXChS/_ssgManifest.js"
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

const NETWORK_TIMEOUT_MS = 2500;

function isProbablyOffline() {
  return typeof self.navigator !== "undefined" && self.navigator.onLine === false;
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(function () {
    controller.abort();
  }, timeoutMs || NETWORK_TIMEOUT_MS);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function cacheFirst(request, options) {
  const opts = options || {};
  const cached = await caches.match(request);
  if (cached) {
    if (!isProbablyOffline() && opts.revalidate !== false) {
      fetchWithTimeout(request).then(function (response) {
        if (response.ok) {
          caches.open(CACHE).then(function (cache) {
            cache.put(request, response.clone());
          });
        }
      }).catch(function () {});
    }
    return cached;
  }
  if (isProbablyOffline()) {
    return Response.error();
  }
  try {
    const response = await fetchWithTimeout(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

async function navigateHandler(request) {
  const cached = await caches.match(request);
  if (isProbablyOffline()) {
    return (
      cached ||
      (await caches.match("/home")) ||
      (await caches.match("/")) ||
      Response.error()
    );
  }
  try {
    const response = await fetchWithTimeout(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      cached ||
      (await caches.match("/home")) ||
      (await caches.match("/")) ||
      Response.error()
    );
  }
}

async function apiHandler(request) {
  if (isProbablyOffline()) {
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const response = await fetchWithTimeout(request);
    if (response.ok && request.method === "GET") {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
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

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(apiHandler(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(navigateHandler(request));
    return;
  }

  // Leave RSC and other Next.js requests to the browser (avoids stale cached flights).
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

function notificationId() {
  return "kn-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

function currentSlotKey() {
  return localDateString() + ":" + currentHour();
}

function hourNotificationTag(hour) {
  return "kingdom-hour-" + hour + "-" + localDateString();
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function readActionTitle(locale) {
  return locale === "sw" ? "Nimesoma" : "Read";
}

function alreadyReadActionTitle(locale) {
  return locale === "sw" ? "Tayari nimesoma" : "Already read";
}

function alreadyReadLabel(locale) {
  return locale === "sw" ? "Tayari nimesoma" : "Already read";
}

function localDayForTimezone(at, timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at));
}

async function isHourSlotAlreadyRead(deviceId, hour, timezone) {
  if (!deviceId) return false;
  try {
    var db = await openReadingDb();
    return await new Promise(function (resolve) {
      var tx = db.transaction("events", "readonly");
      var req = tx.objectStore("events").index("deviceId").getAll(deviceId);
      req.onsuccess = function () {
        var events = req.result || [];
        var today = localDayForTimezone(Date.now(), timezone);
        var hit = events.some(function (e) {
          if (e.missed) return false;
          if (e.hour !== hour) return false;
          return localDayForTimezone(e.shownAt, timezone) === today;
        });
        resolve(hit);
      };
      req.onerror = function () {
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}

async function isNotificationAlreadyRead(deviceId, notificationId) {
  if (!deviceId || !notificationId) return false;
  try {
    var db = await openReadingDb();
    return await new Promise(function (resolve) {
      var tx = db.transaction("events", "readonly");
      var req = tx.objectStore("events").index("notificationId").getAll(notificationId);
      req.onsuccess = function () {
        var hits = req.result || [];
        resolve(hits.some(function (e) { return e.deviceId === deviceId && !e.missed; }));
      };
      req.onerror = function () {
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}

async function readDeviceId() {
  const state = await readNotificationState();
  return state?.deviceId || null;
}

const READING_DB = "kingdom-reading";
const READING_DB_VERSION = 1;

function openReadingDb() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(READING_DB, READING_DB_VERSION);
    req.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains("events")) {
        var store = db.createObjectStore("events", { keyPath: "id" });
        store.createIndex("deviceId", "deviceId", { unique: false });
        store.createIndex("notificationId", "notificationId", { unique: false });
      }
      if (!db.objectStoreNames.contains("reports")) {
        var reports = db.createObjectStore("reports", { keyPath: "id" });
        reports.createIndex("deviceId", "deviceId", { unique: false });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "deviceId" });
      }
    };
    req.onsuccess = function () {
      resolve(req.result);
    };
    req.onerror = function () {
      reject(req.error);
    };
  });
}

function lapseMsToRate(lapseMs, missed) {
  if (missed) return 0;
  return Math.floor(Math.max(0, lapseMs / 1000) / 10) + 1;
}

function saveReadingEventLocal(event) {
  return openReadingDb().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction("events", "readwrite");
      var store = tx.objectStore("events");
      var idx = store.index("notificationId");
      var lookup = idx.getAll(event.notificationId);
      lookup.onsuccess = function () {
        var hits = lookup.result || [];
        if (hits.some(function (e) { return e.deviceId === event.deviceId; })) {
          resolve();
          return;
        }
        store.put(event);
      };
      tx.oncomplete = function () {
        resolve();
      };
      tx.onerror = function () {
        reject(tx.error);
      };
    });
  });
}

async function postReadEvent(data, readAt) {
  const shownAt = data.shownAt || readAt;
  const deviceId = data.deviceId || (await readDeviceId());
  if (!deviceId) return;

  const lapseMs = Math.max(0, readAt - shownAt);
  const event = {
    id: "kn-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9),
    deviceId: deviceId,
    notificationId: data.notificationId || "n-" + readAt,
    shownAt: shownAt,
    readAt: readAt,
    lapseMs: lapseMs,
    rate: lapseMsToRate(lapseMs, false),
    hour: data.hour,
    verseRef: data.verseRef || "",
    theme: data.theme || "",
    themeLabel: data.themeLabel || "",
    locale: data.locale || "en",
    timezone: data.timezone || "UTC",
    missed: false,
  };

  try {
    await saveReadingEventLocal(event);
  } catch {
    /* storage unavailable */
  }

  try {
    await fetch("/api/reading/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        notificationId: event.notificationId,
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
    /* saved locally — syncs when back online */
  }
}

async function postPendingNotification(data) {
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
        isTest: false,
      }),
    });
  } catch {
    /* offline */
  }
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

  const slot = currentSlotKey();
  if (state?.lastSlot === slot) return false;

  const entry = await loadHourlyVerse(locale, hour);
  if (!entry?.passage?.text) return false;

  const ref = entry.passage.ref;
  const title = entry.themeLabel ? entry.themeLabel + " · " + ref : ref;
  const body = entry.passage.text.length > 180
    ? entry.passage.text.slice(0, 177) + "…"
    : entry.passage.text;
  const shownAt = Date.now();
  const nid = notificationId();
  const deviceId = state?.deviceId || (await readDeviceId());
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const alreadyRead = await isHourSlotAlreadyRead(deviceId, hour, timezone);
  const lineTitle = alreadyRead ? title + " · " + alreadyReadLabel(locale) : title;

  await self.registration.showNotification("Kingdom AI", {
    body: lineTitle + "\n\n" + body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: hourNotificationTag(hour),
    renotify: true,
    silent: false,
    vibrate: alreadyRead ? [] : [180, 90, 180],
    requireInteraction: !alreadyRead,
    actions: [
      {
        action: alreadyRead ? "already-read" : "read",
        title: alreadyRead ? alreadyReadActionTitle(locale) : readActionTitle(locale),
      },
    ],
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
      timezone,
      alreadyRead,
    },
  });

  if (!alreadyRead) {
    await postPendingNotification({
      deviceId,
      notificationId: nid,
      shownAt,
      hour,
      verseRef: ref,
      theme: entry.theme,
      themeLabel: entry.themeLabel,
      locale,
      timezone,
    });
  }

  await writeNotificationState({
    ...(state || {}),
    lastSlot: slot,
    lastHour: hour,
  });
  return true;
}

function clearVerseTimer() {
  if (verseTimer !== null) {
    clearTimeout(verseTimer);
    verseTimer = null;
  }
}

async function isServerReachable() {
  if (typeof self.navigator !== "undefined" && self.navigator.onLine === false) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(function () {
      controller.abort();
    }, 2500);
    const res = await fetch("/api/health", {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

async function shouldUseLocalNotifications(state) {
  if (!state?.pushEnabled) return true;
  return !(await isServerReachable());
}

async function scheduleHourlyNotification(locale, notifyHours, delayMs) {
  clearVerseTimer();
  const existing = await readNotificationState();
  const useLocal = await shouldUseLocalNotifications(existing);
  if (existing?.pushEnabled && !useLocal) {
    await writeNotificationState({
      ...(existing || {}),
      enabled: true,
      locale,
      notifyHours: notifyHours ?? [],
      pushEnabled: true,
      nextAt: 0,
    });
    return;
  }

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
    pushEnabled: false,
  });
}

async function resumeHourlyNotifications() {
  const state = await readNotificationState();
  if (!state?.enabled) return;
  if (state.pushEnabled && !(await shouldUseLocalNotifications(state))) return;

  const hour = currentHour();
  const slot = currentSlotKey();
  if (state.lastSlot !== slot && shouldNotifyHour(state, hour)) {
    await showHourlyVerseNotification(state.locale || "en", hour, state.notifyHours);
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

  if (payload.type === "report") {
    return;
  }

  const locale = payload.locale || "en";
  const shownAt = Date.now();
  const nid = notificationId();

  event.waitUntil(
    (async () => {
      const deviceId = payload.deviceId || (await readDeviceId());
      const timezone = payload.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const hour = typeof payload.hour === "number" ? payload.hour : currentHour();
      const alreadyRead = await isHourSlotAlreadyRead(deviceId, hour, timezone);
      const titleLine = alreadyRead
        ? (payload.title || "Kingdom AI") + " · " + alreadyReadLabel(locale)
        : payload.title || "Kingdom AI";

      await self.registration.showNotification("Kingdom AI", {
        body: payload.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: hourNotificationTag(hour),
        renotify: true,
        silent: false,
        vibrate: alreadyRead ? [] : [180, 90, 180],
        requireInteraction: !alreadyRead,
        actions: [
          {
            action: alreadyRead ? "already-read" : "read",
            title: alreadyRead ? alreadyReadActionTitle(locale) : readActionTitle(locale),
          },
        ],
        data: {
          url: payload.url || "/notifications",
          hour: payload.hour,
          locale,
          type: "verse",
          verseRef: payload.verseRef || "",
          theme: payload.theme || "",
          themeLabel: payload.themeLabel || "",
          verseText: payload.verseText || "",
          deviceId: payload.deviceId || "",
          shownAt,
          notificationId: nid,
          timezone,
          alreadyRead,
        },
      });

      if (!alreadyRead) {
        await postPendingNotification({
          deviceId: payload.deviceId,
          notificationId: nid,
          shownAt,
          hour: payload.hour,
          verseRef: payload.verseRef || "",
          theme: payload.theme || "",
          themeLabel: payload.themeLabel || "",
          locale,
          timezone,
        });
      }

      const prev = await readNotificationState();
      await writeNotificationState({
        ...(prev || {}),
        lastSlot: localDateString() + ":" + hour,
        lastHour: hour,
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  const data = event.notification.data || {};
  const action = event.action;
  const readAt = Date.now();
  const locale = data.locale || "en";

  if (action === "already-read" || data.alreadyRead) {
    event.notification.close();
    return;
  }

  if (action === "read" || (!action && data.type === "verse")) {
    event.notification.close();
    event.waitUntil(
      (async () => {
        const deviceId = data.deviceId || (await readDeviceId());
        const already = await isNotificationAlreadyRead(deviceId, data.notificationId);
        if (already) return;
        await postReadEvent(data, readAt);
      })(),
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
        const pushEnabled = Boolean(data.pushEnabled);
        await writeNotificationState({
          ...(prev || {}),
          enabled: true,
          locale: data.locale || "en",
          notifyHours: data.notifyHours || [],
          deviceId: data.deviceId || prev?.deviceId,
          pushEnabled,
        });
        const useLocal = pushEnabled ? !(await isServerReachable()) : true;
        if (pushEnabled && !useLocal) {
          clearVerseTimer();
          return;
        }
        await scheduleHourlyNotification(
          data.locale || "en",
          data.notifyHours || [],
          data.delayMs,
        );
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
});

async function resubscribePushFromState() {
  const state = await readNotificationState();
  if (!state?.enabled) return;

  try {
    const res = await fetch("/api/push/vapid-public-key");
    if (!res.ok) return;
    const data = await res.json();
    if (!data.configured || !data.publicKey) return;

    const registration = self.registration;
    if (!registration?.pushManager) return;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });
    }

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        locale: state.locale || "en",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notifyHours: state.notifyHours || [],
        deviceId: state.deviceId,
      }),
    });
  } catch {
    /* renewal is best-effort */
  }
}

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(resubscribePushFromState());
});

