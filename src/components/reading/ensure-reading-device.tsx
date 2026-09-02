"use client";

import { useEffect } from "react";
import {
  getDeviceTimezone,
  getOrCreateDeviceId,
  syncDeviceIdToWorker,
} from "@/lib/reading/device-id.client";
import { useLocale } from "@/context/locale-context";
import {
  getNotifyHours,
  isVerseNotificationsEnabled,
  syncVerseNotifications,
} from "@/lib/notifications/verse-notifications";
import { loadReadingData } from "@/lib/reading/data.client";
import { subscribeReadingUpdates } from "@/lib/reading/reading-sync.client";

/** Ensures device id exists, local reading store, and optional server sync when online. */
export function EnsureReadingDevice() {
  const { locale } = useLocale();

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    const timezone = getDeviceTimezone();
    const notifyHours = getNotifyHours();

    syncDeviceIdToWorker();

    void loadReadingData(deviceId, timezone, locale, notifyHours).catch(() => {
      /* local store is best-effort */
    });

    const refresh = () => {
      syncDeviceIdToWorker();
      void loadReadingData(deviceId, timezone, locale, notifyHours).catch(() => {
        /* best-effort */
      });
      if (isVerseNotificationsEnabled()) {
        void syncVerseNotifications(locale).catch(() => {
          /* best-effort */
        });
      }
    };

    const unsubscribe = subscribeReadingUpdates(() => {
      refresh();
    });

    if (isVerseNotificationsEnabled()) {
      void syncVerseNotifications(locale).catch(() => {
        /* push is online-only; local alerts still work offline */
      });
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onOnline = () => refresh();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [locale]);

  return null;
}
