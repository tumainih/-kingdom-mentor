"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useLocale } from "@/context/locale-context";

export function OfflineBanner() {
  const { t } = useLocale();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="flex shrink-0 items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-center text-xs text-amber-100/95"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {t("offlineBanner")}
    </div>
  );
}
