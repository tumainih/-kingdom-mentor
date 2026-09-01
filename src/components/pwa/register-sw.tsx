"use client";

import { useEffect } from "react";
import { warmOfflineCache, markOfflineReady } from "@/lib/offline/client-reply";
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

        if (isVerseNotificationsEnabled()) {
          const locale =
            (localStorage.getItem("kingdom-locale") as "en" | "sw" | null) ?? "en";
          void syncVerseNotifications(locale).catch(() => {
            /* notification sync is best-effort */
          });
        }

        if (navigator.onLine) {
          void warmOfflineCache()
            .then(() => markOfflineReady())
            .catch(() => markOfflineReady());
        } else {
          markOfflineReady();
        }
      })
      .catch(() => {
        /* optional */
      });

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!isVerseNotificationsEnabled()) return;
      const locale =
        (localStorage.getItem("kingdom-locale") as "en" | "sw" | null) ?? "en";
      void syncVerseNotifications(locale).catch(() => {
        /* notification sync is best-effort */
      });
    };

    const onOnline = () => {
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
    };

    const onOffline = () => {
      if (!isVerseNotificationsEnabled()) return;
      const locale =
        (localStorage.getItem("kingdom-locale") as "en" | "sw" | null) ?? "en";
      void syncVerseNotifications(locale).catch(() => {
        /* switch worker to local timers */
      });
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
