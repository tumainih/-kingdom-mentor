"use client";

import { useEffect } from "react";
import { warmOfflineCache } from "@/lib/offline/client-reply";
import {
  isVerseNotificationsEnabled,
  syncVerseNotifications,
} from "@/lib/notifications/verse-notifications";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Dev uses Turbopack chunks that never match production precache in sw.js.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
      return;
    }

    void navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage("skipWaiting");
            }
          });
        });

        void warmOfflineCache().catch(() => {
          /* offline warm is best-effort */
        });

        if (isVerseNotificationsEnabled()) {
          const locale =
            (localStorage.getItem("kingdom-locale") as "en" | "sw" | null) ?? "en";
          void syncVerseNotifications(locale).catch(() => {
            /* notification sync is best-effort */
          });
        }
      })
      .catch(() => {
        /* optional */
      });

    const onOnline = () => {
      void warmOfflineCache().catch(() => {
        /* offline warm is best-effort */
      });
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
