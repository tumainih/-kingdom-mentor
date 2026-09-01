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

const precache = [
  "/",
  "/home",
  "/history",
  "/areas",
  "/notifications",
  "/reports",
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
  ...poolAssets,
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

  if (url.pathname.startsWith("/api/hourly-verse") || url.pathname.startsWith("/api/area-verses")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(navigateWithOfflineFallback(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

${notificationSnippet}
`;

writeFileSync(path.join(root, "public", "sw.js"), sw);
console.log(`Generated public/sw.js (${precache.length} precache entries, build ${buildId})`);
