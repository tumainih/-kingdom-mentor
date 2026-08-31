/* Kingdom AI — offline-capable service worker (build 9UudeM6gabe-vB0EylREg) */
const CACHE = "kingdom-ai-9UudeM6gabe-vB0EylREg";
const PRECACHE = [
  "/",
  "/home",
  "/install",
  "/manifest.webmanifest",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/data/hourly-en.json",
  "/data/hourly-sw.json",
  "/_next/static/9UudeM6gabe-vB0EylREg/_buildManifest.js",
  "/_next/static/9UudeM6gabe-vB0EylREg/_clientMiddlewareManifest.js",
  "/_next/static/9UudeM6gabe-vB0EylREg/_ssgManifest.js",
  "/_next/static/chunks/00izapk6l813d.css",
  "/_next/static/chunks/0cz1d0mv5g_q7.js",
  "/_next/static/chunks/0ehjiuuxbbhq9.js",
  "/_next/static/chunks/1npistqcifhdm.js",
  "/_next/static/chunks/1z99mlp5cofct.js",
  "/_next/static/chunks/25055b8q_50pl.js",
  "/_next/static/chunks/2y1nd8vf7h77j.js",
  "/_next/static/chunks/355ypq0vfo-7n.js",
  "/_next/static/chunks/3adwt13tezgym.js",
  "/_next/static/chunks/3niecic96oynk.js",
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
    ).then(() => self.clients.claim()),
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

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
