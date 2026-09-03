/** Routes and light data to prefetch so the installed app works offline. */
const APP_ROUTES = [
  "/",
  "/home",
  "/history",
  "/areas",
  "/notifications",
  "/reports",
  "/install",
  "/privacy",
] as const;

/** Keep warm-cache small — full Bible indexes are ~13MB and crash some phones. */
const CORE_DATA = [
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForServiceWorker(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.ready;
  } catch {
    /* not registered yet */
  }
}

async function fetchQuiet(url: string): Promise<void> {
  try {
    await fetch(url, { cache: "force-cache", credentials: "same-origin" });
  } catch {
    /* best-effort */
  }
}

/** Prefetch app pages + small verse pools. Full Bible loads later on idle if needed. */
export async function warmOfflineCache(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) return;

  const pools = await poolDataUrls();
  const urls = [...CORE_DATA, ...pools, ...APP_ROUTES];

  for (const url of urls) {
    await fetchQuiet(url);
    await sleep(40);
  }

  // Defer huge indexes so first paint / navigation stays responsive.
  const idle = window.requestIdleCallback
    ? (cb: () => void) => window.requestIdleCallback(cb, { timeout: 12_000 })
    : (cb: () => void) => window.setTimeout(cb, 4000);

  idle(() => {
    void (async () => {
      await fetchQuiet("/data/kjv-index.json");
      await sleep(500);
      await fetchQuiet("/data/swahili-index.json");
    })();
  });
}

/** Mark offline-ready immediately; warm cache in background when online. */
export async function ensureOfflineReady(): Promise<void> {
  if (typeof window === "undefined") return;
  markOfflineReady();
  if (!navigator.onLine) return;
  await waitForServiceWorker();
  void warmOfflineCache();
}

export function isOfflineReadyFlagSet(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("kingdom-offline-ready") === "1";
}

export function markOfflineReady(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("kingdom-offline-ready", "1");
}
