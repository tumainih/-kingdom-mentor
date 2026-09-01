"use client";

import { useEffect } from "react";
import {
  getDeviceTimezone,
  getOrCreateDeviceId,
} from "@/lib/reading/device-id.client";
import { useLocale } from "@/context/locale-context";
import {
  getNotifyHours,
  isVerseNotificationsEnabled,
  syncVerseNotifications,
} from "@/lib/notifications/verse-notifications";

/** Ensures device id exists, registers app start, and syncs push + tracking hours. */
export function EnsureReadingDevice() {
  const { locale } = useLocale();

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    const timezone = getDeviceTimezone();
    const notifyHours = getNotifyHours();

    void fetch(
      "/api/reading/events?" +
        new URLSearchParams({
          deviceId,
          timezone,
          locale,
          notifyHours: JSON.stringify(notifyHours),
        }),
    ).catch(() => {
      /* best-effort */
    });

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "SET_DEVICE_ID", deviceId, timezone });
      });
    }

    if (isVerseNotificationsEnabled()) {
      void syncVerseNotifications(locale).catch(() => {
        /* best-effort */
      });
    }

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void syncVerseNotifications(locale).catch(() => {
        /* best-effort */
      });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [locale]);

  return null;
}
