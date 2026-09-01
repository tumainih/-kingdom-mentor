"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, Copy, MessageSquare } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import { getSlotForHour, themeLabel, type HourlyThemeId } from "@/lib/bible/hourly-themes";
import {
  localDateString,
  resolveHourlyVerseClient,
} from "@/lib/bible/resolve-hourly-verse.client";

interface HourlyVersePayload {
  hour: number;
  theme: HourlyThemeId;
  themeLabel: string;
  scheduledRef: string;
  poolSize: number;
  passage: { ref: string; text: string; refEn?: string } | null;
}

function formatDate(date: Date, locale: "en" | "sw", compact: boolean): string {
  const loc = locale === "sw" ? "sw-KE" : "en-US";
  if (compact) {
    return new Intl.DateTimeFormat(loc, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  }
  return new Intl.DateTimeFormat(loc, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
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
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const update = () => setCompact(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const fetchVerse = useCallback(
    async (hour: number, dateStr: string) => {
      setLoading(true);
      try {
        const slot = getSlotForHour(hour);
        const resolved = await resolveHourlyVerseClient(
          slot.theme,
          locale,
          hour,
          dateStr,
        );
        if (resolved.passage) {
          setVerse({
            hour: slot.hour,
            theme: slot.theme,
            themeLabel: themeLabel(slot.theme, locale),
            scheduledRef: resolved.scheduledRef,
            poolSize: resolved.poolSize,
            passage: resolved.passage,
          });
          return;
        }

        const res = await fetch(
          `/api/hourly-verse?locale=${locale}&hour=${hour}&date=${dateStr}`,
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

  // Only use client clock after mount — avoids SSR timezone hydration mismatch.
  const currentHour = now?.getHours() ?? null;

  useEffect(() => {
    if (currentHour === null || !now) return;
    void fetchVerse(currentHour, localDateString(now));
  }, [currentHour, now, fetchVerse]);

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
      <AppHeader aiReady showNav compactNav hideStatusOnMobile />

      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:pt-3">
        {/* Clock — fixed height, no grow */}
        <div className="shrink-0 text-center">
          {now && (
            <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-sm">
              {formatDate(now, locale, compact)}
            </p>
          )}

          <div className="mt-1 font-heading tabular-nums tracking-tight sm:mt-2">
            {time ? (
              <>
                <span className="text-[2.75rem] font-semibold leading-none text-foreground sm:text-6xl lg:text-7xl">
                  {pad(time.hours)}
                  <span className="animate-pulse text-brand">:</span>
                  {pad(time.minutes)}
                </span>
                <span className="ml-0.5 text-lg text-muted-foreground sm:ml-1 sm:text-2xl lg:text-3xl">
                  {pad(time.seconds)}
                </span>
              </>
            ) : (
              <span className="text-4xl text-muted-foreground sm:text-6xl">--:--</span>
            )}
          </div>

          <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
            {currentHour !== null
              ? t("homeHourLabel", { hour: currentHour })
              : "\u00a0"}
          </p>
        </div>

        {/* Verse — scrolls if long */}
        <div className="mt-2 flex min-h-0 flex-1 flex-col sm:mt-3">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {loading && !verse ? (
              <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-6 text-center text-xs text-muted-foreground sm:rounded-2xl sm:px-6 sm:py-8 sm:text-sm">
                {t("homeLoading")}
              </div>
            ) : verse?.passage ? (
              <div className="knowledge-card rounded-xl px-3.5 py-3.5 text-left sm:rounded-2xl sm:px-5 sm:py-5">
                <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
                  <span className="truncate rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-light sm:px-3 sm:py-1 sm:text-[11px]">
                    {verse.themeLabel}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void copyVerse()}
                    className="h-7 shrink-0 gap-1 px-1.5 text-[10px] text-muted-foreground hover:text-foreground sm:h-8 sm:px-2 sm:text-xs"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-brand sm:h-3.5 sm:w-3.5" />
                    ) : (
                      <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    )}
                    {copied ? t("copied") : t("copy")}
                  </Button>
                </div>

                <p className="font-heading text-base font-semibold leading-snug text-brand-light sm:text-lg">
                  {verse.passage.ref}
                  {verse.passage.refEn &&
                  verse.passage.refEn !== verse.passage.ref ? (
                    <span className="ml-1 block text-[11px] font-normal text-muted-foreground sm:ml-1.5 sm:inline sm:text-sm">
                      ({verse.passage.refEn})
                    </span>
                  ) : null}
                </p>

                <p className="mt-2.5 text-sm leading-relaxed text-foreground/95 sm:mt-3 sm:text-base sm:leading-relaxed">
                  {verse.passage.text}
                </p>

                <p className="mt-3 text-[10px] text-muted-foreground sm:mt-4 sm:text-[11px]">
                  {currentHour !== null
                    ? t("homeChangesAt", {
                        hour: pad((currentHour + 1) % 24),
                      })
                    : null}
                  {verse.poolSize > 0 ? (
                    <span className="mt-0.5 block">
                      {t("homePoolSize", { count: verse.poolSize })}
                    </span>
                  ) : null}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                {t("homeVerseUnavailable")}
              </div>
            )}
          </div>
        </div>

        {/* Footer — pinned bottom */}
        <div className="shrink-0 pt-2 text-center sm:pt-3">
          <p className="mx-auto mb-2 hidden max-w-sm text-[10px] leading-snug text-muted-foreground sm:block sm:text-xs">
            {t("homeSubtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/history"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand/30 px-3 text-xs font-medium"
            >
              {t("navHistory")}
            </Link>
            <Link
              href="/areas"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 px-3 text-xs font-medium text-muted-foreground"
            >
              {t("navAreas")}
            </Link>
            <Link
              href="/notifications"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 px-3 text-xs font-medium text-muted-foreground"
            >
              <Bell className="h-3.5 w-3.5" />
              {t("navAlerts")}
            </Link>
            <Link
              href="/"
              className="inline-flex h-8 max-w-full items-center justify-center gap-1.5 truncate rounded-lg border border-brand/30 bg-background px-3 text-xs font-medium transition-colors hover:bg-muted sm:px-4 sm:text-sm"
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{t("homeGoChat")}</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
