"use client";

import { useEffect } from "react";
import { getOrCreateDeviceId, getDeviceTimezone } from "@/lib/reading/device-id.client";
import { useLocale } from "@/context/locale-context";

/** Ensures device id exists and registers app start for reading reports. */
export function EnsureReadingDevice() {
  const { locale } = useLocale();

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    const timezone = getDeviceTimezone();
    void fetch("/api/reading/events?" + new URLSearchParams({ deviceId, timezone, locale }))
      .catch(() => {
        /* best-effort */
      });

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "SET_DEVICE_ID", deviceId, timezone });
      });
    }
  }, [locale]);

  return null;
}
