"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Home,
  Link2,
  Bell,
  Share2,
  Smartphone,
  WifiOff,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import {
  detectInstallPlatform,
  getInstallPageUrl,
  isStandaloneApp,
  type InstallPlatform,
} from "@/lib/pwa/platform";
import {
  ensureOfflineReady,
  isOfflineReadyFlagSet,
  markOfflineReady,
} from "@/lib/offline/client-reply";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-3 list-decimal space-y-2 pl-5 text-left text-xs leading-relaxed text-muted-foreground sm:text-sm">
      {steps.map((step, i) => (
        <li key={i}>{step}</li>
      ))}
    </ol>
  );
}

function PlatformCard({
  title,
  children,
  active,
}: {
  title: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border px-4 py-3 text-left ${
        active
          ? "border-brand/40 bg-brand/10 ring-1 ring-brand/20"
          : "border-border/50 bg-muted/20"
      }`}
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function InstallAppView() {
  const { t } = useLocale();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<InstallPlatform>("unknown");
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installUrl, setInstallUrl] = useState("/install");
  const [offlineReady, setOfflineReady] = useState(false);
  const [offlinePreparing, setOfflinePreparing] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setPlatform(detectInstallPlatform());
    setInstalled(isStandaloneApp());
    setInstallUrl(getInstallPageUrl());
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  useEffect(() => {
    if (!navigator.onLine) {
      setOfflineReady(isOfflineReadyFlagSet());
      return;
    }
    setOfflinePreparing(true);
    void ensureOfflineReady()
      .then(() => {
        markOfflineReady();
        setOfflineReady(true);
      })
      .catch(() => {
        setOfflineReady(isOfflineReadyFlagSet());
      })
      .finally(() => {
        setOfflinePreparing(false);
      });
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

  const copyLink = useCallback(async () => {
    const url = getInstallPageUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  const shareLink = useCallback(async () => {
    const url = getInstallPageUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Kingdom AI",
          text: t("installShareText"),
          url,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      void copyLink();
    }
  }, [copyLink, t]);

  const showIos = platform === "ios-safari" || platform === "ios-other";
  const showAndroid = platform === "android" || platform === "unknown";
  const showBoth = platform === "desktop" || platform === "unknown";

  const iosSteps =
    platform === "ios-other"
      ? [t("installIosOpenSafari"), t("installIosStep1"), t("installIosStep2")]
      : [t("installIosStep1"), t("installIosStep2")];

  const androidSteps = deferred
    ? [t("installAndroidTapButton")]
    : [t("installAndroidStep1"), t("installAndroidStep2"), t("installAndroidStep3")];

  return (
    <div className="canvas-gradient flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <AppHeader aiReady showNav compactNav hideStatusOnMobile />

      <main className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <div className="my-auto w-full rounded-2xl border border-brand/25 bg-card/80 p-5 text-center sm:p-8">
          <Smartphone className="mx-auto h-10 w-10 text-brand" />
          <h1 className="mt-4 font-heading text-xl font-semibold text-foreground sm:text-2xl">
            {t("installTitle")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("installSubtitle")}
          </p>

          <div className="mt-4 rounded-lg border border-brand/25 bg-brand/5 px-3 py-2.5 text-left">
            <p className="flex items-center gap-2 text-xs font-semibold text-brand-light">
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
              {t("installOfflineTitle")}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
              {t("installOfflineHint")}
            </p>
            {offlinePreparing ? (
              <p className="mt-2 text-[10px] text-muted-foreground">{t("installOfflinePreparing")}</p>
            ) : offlineReady ? (
              <p className="mt-2 flex items-center gap-1 text-[10px] text-brand-light">
                <Check className="h-3 w-3" />
                {t("installOfflineReady")}
              </p>
            ) : null}
          </div>

          <Link
            href="/notifications"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2.5 text-xs font-medium text-brand-light transition-colors hover:bg-brand/10"
          >
            <Bell className="h-4 w-4 shrink-0" />
            {t("notifyInstallLink")}
          </Link>

          <div className="mt-4 rounded-lg border border-border/40 bg-muted/30 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("installOneLink")}
            </p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">{installUrl}</p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => void copyLink()}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    {t("copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    {t("installCopyLink")}
                  </>
                )}
              </Button>
              {canShare && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => void shareLink()}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t("installShareLink")}
                </Button>
              )}
            </div>
          </div>

          {installed ? (
            <div className="mt-6 space-y-3">
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-brand-light">
                <Check className="h-4 w-4" />
                {t("installDone")}
              </p>
              <Link
                href="/home"
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-primary-foreground"
              >
                <Home className="h-4 w-4" />
                {t("installOpenApp")}
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {deferred && (
                <Button
                  className="w-full gap-2"
                  onClick={() => void install()}
                  disabled={installing}
                >
                  <Download className="h-4 w-4" />
                  {installing ? t("installWorking") : t("installButton")}
                </Button>
              )}

              {platform === "ios-other" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-100/90">
                  <p className="flex items-start gap-2 font-medium">
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
                    {t("installIosSafariRequired")}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {(showBoth || showIos) && (
                  <PlatformCard
                    title={t("installIosTitle")}
                    active={platform === "ios-safari" || platform === "ios-other"}
                  >
                    <StepList steps={iosSteps} />
                  </PlatformCard>
                )}

                {(showBoth || showAndroid) && (
                  <PlatformCard title={t("installAndroidTitle")} active={platform === "android"}>
                    <StepList steps={androidSteps} />
                  </PlatformCard>
                )}

                {platform === "desktop" && (
                  <PlatformCard title={t("installDesktopTitle")}>
                    <p className="mt-2 text-left text-xs text-muted-foreground sm:text-sm">
                      {t("installDesktopHint")}
                    </p>
                  </PlatformCard>
                )}
              </div>

              <Link
                href="/home"
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-brand/30 bg-background px-4 text-sm font-medium"
              >
                <Link2 className="h-4 w-4" />
                {t("installOpenBrowser")}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
