"use client";

import { useEffect } from "react";
import { warmOfflineCache } from "@/lib/offline/client-reply";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

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

        void warmOfflineCache();
      })
      .catch(() => {
        /* optional */
      });

    const onOnline = () => void warmOfflineCache();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
