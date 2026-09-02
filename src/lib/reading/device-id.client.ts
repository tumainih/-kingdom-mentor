const DEVICE_KEY = "kingdom-device-id";

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Share device id with the service worker so notification Read works offline. */
export function syncDeviceIdToWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const deviceId = getOrCreateDeviceId();
  const timezone = getDeviceTimezone();
  void navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: "SET_DEVICE_ID", deviceId, timezone });
  });
}
