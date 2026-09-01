import type { AppLocale } from "@/lib/i18n/translations";

const ENABLED_KEY = "kingdom-verse-notifications";
const HOURS_KEY = "kingdom-notify-hours";

export const DEFAULT_NOTIFY_HOURS = [6, 9, 12, 15, 18];

export function isVerseNotificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window
  );
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "PushManager" in window &&
    "serviceWorker" in navigator
  );
}

export function getNotifyHours(): number[] {
  if (typeof window === "undefined") return DEFAULT_NOTIFY_HOURS;
  try {
    const raw = localStorage.getItem(HOURS_KEY);
    if (!raw) return DEFAULT_NOTIFY_HOURS;
    const parsed = JSON.parse(raw) as number[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_NOTIFY_HOURS;
    return parsed.filter((h) => h >= 0 && h <= 23).sort((a, b) => a - b);
  } catch {
    return DEFAULT_NOTIFY_HOURS;
  }
}

export function setNotifyHours(hours: number[]): void {
  const cleaned = [...new Set(hours.filter((h) => h >= 0 && h <= 23))].sort(
    (a, b) => a - b,
  );
  localStorage.setItem(HOURS_KEY, JSON.stringify(cleaned));
}

export function isVerseNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ENABLED_KEY) === "1";
}

function persistEnabled(enabled: boolean): void {
  if (enabled) localStorage.setItem(ENABLED_KEY, "1");
  else localStorage.removeItem(ENABLED_KEY);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.ready;
}

async function subscribeToPush(
  locale: AppLocale,
  notifyHours: number[],
): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  const res = await fetch("/api/push/vapid-public-key");
  const data = (await res.json()) as { configured?: boolean; publicKey?: string };
  if (!data.configured || !data.publicKey) return null;

  const registration = await getReadyRegistration();
  if (!registration?.pushManager) return null;

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
      subscription,
      locale,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notifyHours,
    }),
  });

  return subscription;
}

async function unsubscribeFromPush(): Promise<void> {
  const registration = await getReadyRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  if (!subscription) return;

  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
}

function postToWorker(message: object): void {
  void getReadyRegistration().then((registration) => {
    registration?.active?.postMessage(message);
  });
}

export async function enableVerseNotifications(
  locale: AppLocale,
  options?: { showNow?: boolean; notifyHours?: number[] },
): Promise<NotificationPermission> {
  if (!isVerseNotificationsSupported()) {
    throw new Error("Notifications are not supported on this device.");
  }

  const notifyHours = options?.notifyHours ?? getNotifyHours();

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    persistEnabled(false);
    return permission;
  }

  await subscribeToPush(locale, notifyHours);

  postToWorker({
    type: "START_HOURLY_NOTIFICATIONS",
    locale,
    notifyHours,
    showNow: options?.showNow ?? false,
  });

  persistEnabled(true);
  return permission;
}

export async function disableVerseNotifications(): Promise<void> {
  persistEnabled(false);
  await unsubscribeFromPush();
  postToWorker({ type: "STOP_HOURLY_NOTIFICATIONS" });
}

export async function syncVerseNotifications(locale: AppLocale): Promise<void> {
  if (!isVerseNotificationsEnabled()) return;
  if (Notification.permission !== "granted") return;

  const notifyHours = getNotifyHours();
  await subscribeToPush(locale, notifyHours);

  postToWorker({
    type: "START_HOURLY_NOTIFICATIONS",
    locale,
    notifyHours,
    showNow: false,
  });
}

export async function showHourVerseNotification(
  locale: AppLocale,
  hour: number,
): Promise<void> {
  postToWorker({
    type: "SHOW_HOUR_VERSE",
    locale,
    hour,
    notifyHours: getNotifyHours(),
  });
}

export async function previewHourVerseNotification(
  locale: AppLocale,
  hour: number,
): Promise<void> {
  if (Notification.permission !== "granted") return;
  postToWorker({
    type: "SHOW_HOUR_VERSE",
    locale,
    hour,
    notifyHours: getNotifyHours(),
  });
}
