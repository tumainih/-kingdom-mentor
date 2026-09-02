"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import {
  applyServiceWorkerUpdate,
  checkForServiceWorkerUpdate,
  hasWaitingServiceWorker,
  onServiceWorkerUpdateReady,
} from "@/lib/pwa/sw-update";
import { isStandaloneApp } from "@/lib/pwa/platform";

export function UpdateBanner() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const scanForUpdate = useCallback(async () => {
    const registration = await checkForServiceWorkerUpdate();
    if (hasWaitingServiceWorker(registration)) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    void scanForUpdate();
    return onServiceWorkerUpdateReady(() => setVisible(true));
  }, [scanForUpdate]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void scanForUpdate();
      }
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [scanForUpdate]);

  const applyUpdate = useCallback(async () => {
    setBusy(true);
    try {
      await applyServiceWorkerUpdate();
    } catch {
      setBusy(false);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-brand/30 bg-brand/10 px-3 py-2 text-center text-xs text-foreground"
    >
      <RefreshCw className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
      <span>
        {isStandaloneApp() ? t("updateInstalledHint") : t("updateAvailableHint")}
      </span>
      <Button
        type="button"
        size="sm"
        variant="default"
        className="h-7 px-2.5 text-[11px]"
        disabled={busy}
        onClick={() => void applyUpdate()}
      >
        {busy ? t("updateWorking") : t("updateNow")}
      </Button>
    </div>
  );
}
