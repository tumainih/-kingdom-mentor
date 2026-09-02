"use client";

import { useEffect } from "react";
import { warmOfflineCache, markOfflineReady } from "@/lib/offline/client-reply";
import {
  isVerseNotificationsEnabled,
  syncVerseNotifications,
} from "@/lib/notifications/verse-notifications";
import {
  checkForServiceWorkerUpdate,
  notifyServiceWorkerUpdateReady,
} from "@/lib/pwa/sw-update";
import { isStandaloneApp } from "@/lib/pwa/platform";

function wireWaitingWorker(registration: ServiceWorkerRegistration): void {
  if (!registration.waiting || !navigator.serviceWorker.controller) return;
  notifyServiceWorkerUpdateReady();
  if (isStandaloneApp()) {
    registration.waiting.postMessage("skipWaiting");
  }
}

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

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      const url = new URL(window.location.href);
      url.searchParams.set("_v", Date.now().toString());
      window.location.replace(url.pathname + url.search + url.hash);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        wireWaitingWorker(registration);

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state !== "installed") return;
            if (!navigator.serviceWorker.controller) return;

            notifyServiceWorkerUpdateReady();
            if (isStandaloneApp()) {
              worker.postMessage("skipWaiting");
            }
          });
        });

        void checkForServiceWorkerUpdate().then((updated) => {
          wireWaitingWorker(updated ?? registration);
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

      void checkForServiceWorkerUpdate().then((registration) => {
        if (registration) wireWaitingWorker(registration);
      });

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
      void checkForServiceWorkerUpdate();
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

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
