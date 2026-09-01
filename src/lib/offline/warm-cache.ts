/** Routes and data to prefetch so the installed app works offline. */
const APP_ROUTES = [
  "/",
  "/home",
  "/history",
  "/areas",
  "/notifications",
  "/install",
] as const;

const CORE_DATA = [
  "/data/kjv-index.json",
  "/data/swahili-index.json",
  "/data/hourly-en.json",
  "/data/hourly-sw.json",
  "/data/hourly-schedule.json",
  "/data/pools/index.json",
] as const;

async function poolDataUrls(): Promise<string[]> {
  try {
    const res = await fetch("/data/pools/index.json", { cache: "force-cache" });
    if (!res.ok) return [];
    const data = (await res.json()) as { areas?: { id: string }[] };
    return (data.areas ?? []).map((area) => `/data/pools/${area.id}.json`);
  } catch {
    return [];
  }
}

async function waitForServiceWorker(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.ready;
  } catch {
    /* not registered yet */
  }
}

/** Prefetch Bible data, verse pools, and app pages into the cache (via SW when active). */
export async function warmOfflineCache(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) return;

  const pools = await poolDataUrls();
  const urls = [...CORE_DATA, ...pools, ...APP_ROUTES];

  await Promise.allSettled(
    urls.map((url) =>
      fetch(url, { cache: "force-cache", credentials: "same-origin" }),
    ),
  );
}

/** Wait for the service worker, then prefetch everything needed for offline use. */
export async function ensureOfflineReady(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) return;
  await waitForServiceWorker();
  await warmOfflineCache();
}

export function isOfflineReadyFlagSet(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("kingdom-offline-ready") === "1";
}

export function markOfflineReady(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("kingdom-offline-ready", "1");
}
