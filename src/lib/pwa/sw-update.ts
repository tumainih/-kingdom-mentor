/** Check for a new service worker and activate it when ready. */
export async function checkForServiceWorkerUpdate(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return registration;
  } catch {
    return null;
  }
}

export function hasWaitingServiceWorker(
  registration: ServiceWorkerRegistration | null | undefined,
): boolean {
  return Boolean(registration?.waiting);
}

/** Tell the waiting worker to take control, then reload. */
export async function applyServiceWorkerUpdate(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    window.location.reload();
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  if (registration.waiting) {
    registration.waiting.postMessage("skipWaiting");
  } else {
    await registration.update();
  }

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 1500);
    const onControllerChange = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange, {
      once: true,
    });
  });

  const url = new URL(window.location.href);
  url.searchParams.set("_v", Date.now().toString());
  window.location.replace(url.pathname + url.search + url.hash);
}

export function onServiceWorkerUpdateReady(listener: () => void): () => void {
  window.addEventListener("kingdom-sw-update-ready", listener);
  return () => window.removeEventListener("kingdom-sw-update-ready", listener);
}

export function notifyServiceWorkerUpdateReady(): void {
  window.dispatchEvent(new CustomEvent("kingdom-sw-update-ready"));
}
