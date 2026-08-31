"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, Home, Share, Smartphone } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import { RegisterServiceWorker } from "./register-sw";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform() {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

export function InstallAppView() {
  const { t } = useLocale();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState("unknown");
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
    } finally {
      setInstalling(false);
    }
  }, [deferred]);

  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="canvas-gradient flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <RegisterServiceWorker />
      <AppHeader aiReady showNav compactNav hideStatusOnMobile />

      <main className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col items-center justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <div className="rounded-2xl border border-brand/25 bg-card/80 p-6 sm:p-8">
          <Smartphone className="mx-auto h-10 w-10 text-brand" />
          <h1 className="mt-4 font-heading text-xl font-semibold text-foreground sm:text-2xl">
            {t("installTitle")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("installSubtitle")}
          </p>

          {installed ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium text-brand-light">{t("installDone")}</p>
              <Link
                href="/home"
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-primary-foreground"
              >
                <Home className="h-4 w-4" />
                {t("installOpenApp")}
              </Link>
            </div>
          ) : deferred ? (
            <Button
              className="mt-6 w-full gap-2"
              onClick={() => void install()}
              disabled={installing}
            >
              <Download className="h-4 w-4" />
              {installing ? t("installWorking") : t("installButton")}
            </Button>
          ) : platform === "ios" ? (
            <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-left text-sm text-muted-foreground">
              <p className="flex items-start gap-2 font-medium text-foreground">
                <Share className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {t("installIosTitle")}
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs sm:text-sm">
                <li>{t("installIosStep1")}</li>
                <li>{t("installIosStep2")}</li>
              </ol>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-muted-foreground">{t("installAndroidHint")}</p>
              <Link
                href="/home"
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-brand/30 bg-background px-4 text-sm font-medium"
              >
                {t("installOpenBrowser")}
              </Link>
            </div>
          )}

          <p className="mt-5 break-all text-[10px] text-muted-foreground/80">{appUrl}</p>
        </div>
      </main>
    </div>
  );
}
