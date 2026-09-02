import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const notificationSnippet = readFileSync(
  path.join(root, "scripts", "sw-notifications.snippet.js"),
  "utf8",
);
const nextDir = path.join(root, ".next");
const buildId = readFileSync(path.join(nextDir, "BUILD_ID"), "utf8").trim();
const staticDir = path.join(nextDir, "static");

function walk(dir, base = "") {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = `${base}/${name}`;
    if (statSync(full).isDirectory()) {
      entries.push(...walk(full, rel));
    } else {
      entries.push(`/_next/static${rel}`);
    }
  }
  return entries;
}

const staticAssets = walk(staticDir);

const poolAssets = [];
const poolsDir = path.join(root, "public", "data", "pools");
try {
  for (const name of readdirSync(poolsDir)) {
    poolAssets.push(`/data/pools/${name}`);
  }
} catch {
  /* pools not built yet */
}

const areaAssets = [];
const areasDir = path.join(root, "public", "data", "areas");
try {
  for (const locale of readdirSync(areasDir)) {
    const localeDir = path.join(areasDir, locale);
    if (!statSync(localeDir).isDirectory()) continue;
    for (const name of readdirSync(localeDir)) {
      areaAssets.push(`/data/areas/${locale}/${name}`);
    }
  }
} catch {
  /* area bundles not built yet */
}

const precache = [
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
  ...poolAssets,
  ...areaAssets,
  ...staticAssets,
];

const sw = `/* Kingdom AI — offline-capable service worker (build ${buildId}) */
const CACHE = "kingdom-ai-${buildId}";
const PRECACHE = ${JSON.stringify(precache, null, 2)};

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
  const reload =
    request.cache === "reload" ||
    request.headers.get("cache-control")?.includes("max-age=0") ||
    request.headers.get("pragma") === "no-cache";

  if (isProbablyOffline()) {
    const cached = await caches.match(request);
    return (
      cached ||
      (await caches.match("/home")) ||
      (await caches.match("/")) ||
      Response.error()
    );
  }

  const fetchRequest = reload
    ? new Request(request.url, { cache: "no-store", headers: request.headers })
    : request;
  const timeoutMs = reload ? 8000 : NETWORK_TIMEOUT_MS;

  try {
    const response = await fetchWithTimeout(fetchRequest, timeoutMs);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (reload) {
      try {
        const response = await fetch(fetchRequest, { cache: "no-store" });
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached = await caches.match(request);
        return cached || Response.error();
      }
    }

    const cached = await caches.match(request);
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

${notificationSnippet}
`;

writeFileSync(path.join(root, "public", "sw.js"), sw);
console.log(`Generated public/sw.js (${precache.length} precache entries, build ${buildId})`);
