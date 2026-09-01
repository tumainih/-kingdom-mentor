import type { AppLocale } from "@/lib/i18n/translations";

const STORAGE_KEY = "kingdom-verse-notifications";

export function isVerseNotificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window
  );
}

export function isVerseNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

function persistEnabled(enabled: boolean): void {
  if (enabled) localStorage.setItem(STORAGE_KEY, "1");
  else localStorage.removeItem(STORAGE_KEY);
}

async function getReadyWorker(): Promise<ServiceWorker | null> {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.active;
}

export async function enableVerseNotifications(
  locale: AppLocale,
  options?: { showNow?: boolean },
): Promise<NotificationPermission> {
  if (!isVerseNotificationsSupported()) {
    throw new Error("Notifications are not supported on this device.");
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    persistEnabled(false);
    return permission;
  }

  const worker = await getReadyWorker();
  worker?.postMessage({
    type: "START_VERSE_NOTIFICATIONS",
    locale,
    showNow: options?.showNow ?? true,
  });

  persistEnabled(true);
  return permission;
}

export async function disableVerseNotifications(): Promise<void> {
  persistEnabled(false);
  const worker = await getReadyWorker();
  worker?.postMessage({ type: "STOP_VERSE_NOTIFICATIONS" });
}

export async function syncVerseNotifications(locale: AppLocale): Promise<void> {
  if (!isVerseNotificationsEnabled()) return;
  if (Notification.permission !== "granted") return;

  const worker = await getReadyWorker();
  worker?.postMessage({
    type: "START_VERSE_NOTIFICATIONS",
    locale,
    showNow: false,
  });
}

export async function showVerseNotificationNow(locale: AppLocale): Promise<void> {
  const worker = await getReadyWorker();
  worker?.postMessage({ type: "SHOW_VERSE_NOW", locale });
}
