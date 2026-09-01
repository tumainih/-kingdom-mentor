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
import { loadReadingData } from "@/lib/reading/data.client";

/** Ensures device id exists, local reading store, and optional server sync when online. */
export function EnsureReadingDevice() {
  const { locale } = useLocale();

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    const timezone = getDeviceTimezone();
    const notifyHours = getNotifyHours();

    void loadReadingData(deviceId, timezone, locale, notifyHours).catch(() => {
      /* local store is best-effort */
    });

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "SET_DEVICE_ID", deviceId, timezone });
      });
    }

    if (isVerseNotificationsEnabled()) {
      void syncVerseNotifications(locale).catch(() => {
        /* push is online-only; local alerts still work offline */
      });
    }

    const refresh = () => {
      void loadReadingData(deviceId, timezone, locale, notifyHours).catch(() => {
        /* best-effort */
      });
      if (isVerseNotificationsEnabled()) {
        void syncVerseNotifications(locale).catch(() => {
          /* best-effort */
        });
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onOnline = () => refresh();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [locale]);

  return null;
}
