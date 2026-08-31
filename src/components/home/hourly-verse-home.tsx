"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, MessageSquare } from "lucide-react";
import { BrandLogo, BrandTitle } from "@/components/chat/brand";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import type { HourlyThemeId } from "@/lib/bible/hourly-themes";

interface HourlyVersePayload {
  hour: number;
  theme: HourlyThemeId;
  themeLabel: string;
  scheduledRef: string;
  passage: { ref: string; text: string; refEn?: string } | null;
}

function formatDate(date: Date, locale: "en" | "sw"): string {
  return new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatTimeParts(date: Date) {
  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function HourlyVerseHome() {
  const { locale, t } = useLocale();
  const [now, setNow] = useState<Date | null>(null);
  const [verse, setVerse] = useState<HourlyVersePayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchVerse = useCallback(
    async (hour: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/hourly-verse?locale=${locale}&hour=${hour}`,
        );
        const data = (await res.json()) as HourlyVersePayload;
        setVerse(data);
      } catch {
        setVerse(null);
      } finally {
        setLoading(false);
      }
    },
    [locale],
  );

  useEffect(() => {
    setNow(new Date());
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  const currentHour = now?.getHours() ?? new Date().getHours();

  useEffect(() => {
    void fetchVerse(currentHour);
  }, [currentHour, fetchVerse]);

  const copyVerse = useCallback(async () => {
    if (!verse?.passage) return;
    const label =
      verse.passage.refEn && verse.passage.refEn !== verse.passage.ref
        ? `${verse.passage.ref} (${verse.passage.refEn})`
        : verse.passage.ref;
    const text = `${label}\n${verse.passage.text}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [verse]);

  const time = now ? formatTimeParts(now) : null;

  return (
    <div className="canvas-gradient relative flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <AppHeader aiReady showNav />

      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {now && (
            <p className="text-sm font-medium text-muted-foreground sm:text-base">
              {formatDate(now, locale)}
            </p>
          )}

          <div className="mt-4 font-heading tabular-nums tracking-tight">
            {time ? (
              <>
                <span className="text-5xl font-semibold text-foreground sm:text-7xl">
                  {pad(time.hours)}
                  <span className="animate-pulse text-brand">:</span>
                  {pad(time.minutes)}
                </span>
                <span className="ml-1 text-2xl text-muted-foreground sm:text-3xl">
                  {pad(time.seconds)}
                </span>
              </>
            ) : (
              <span className="text-5xl text-muted-foreground sm:text-7xl">--:--</span>
            )}
          </div>

          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            {t("homeHourLabel", { hour: currentHour })}
          </p>

          <div className="mt-8 w-full max-w-xl">
            {loading && !verse ? (
              <div className="rounded-2xl border border-border/50 bg-card/60 px-6 py-10 text-sm text-muted-foreground">
                {t("homeLoading")}
              </div>
            ) : verse?.passage ? (
              <div className="knowledge-card rounded-2xl px-5 py-6 text-left sm:px-7 sm:py-8">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-light">
                    {verse.themeLabel}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void copyVerse()}
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-brand" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? t("copied") : t("copy")}
                  </Button>
                </div>

                <p className="font-heading text-lg font-semibold text-brand-light sm:text-xl">
                  {verse.passage.ref}
                  {verse.passage.refEn &&
                  verse.passage.refEn !== verse.passage.ref ? (
                    <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                      ({verse.passage.refEn})
                    </span>
                  ) : null}
                </p>

                <p className="mt-4 font-heading text-base leading-relaxed text-foreground/95 sm:text-lg sm:leading-relaxed">
                  {verse.passage.text}
                </p>

                <p className="mt-5 text-[11px] text-muted-foreground">
                  {t("homeChangesAt", {
                    hour: pad((currentHour + 1) % 24),
                  })}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/50 bg-card/60 px-6 py-10 text-sm text-muted-foreground">
                {t("homeVerseUnavailable")}
              </div>
            )}
          </div>

          <p className="mt-6 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {t("homeSubtitle")}
          </p>
        </div>

        <div className="shrink-0 pb-2 pt-4 text-center">
          <Link
            href="/"
            className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-brand/30 bg-background px-3 text-sm font-medium transition-colors hover:bg-muted sm:h-9"
          >
            <MessageSquare className="h-4 w-4" />
            {t("homeGoChat")}
          </Link>
        </div>
      </main>
    </div>
  );
}

export function HomePageBrand() {
  return (
    <div className="mb-6 flex flex-col items-center gap-2">
      <BrandLogo size="lg" className="logo-glow-ring rounded-2xl" />
      <BrandTitle size="lg" />
    </div>
  );
}
