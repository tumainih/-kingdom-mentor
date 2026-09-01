"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Check, Copy, Home } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import {
  clampHourForDate,
  localDateInputValue,
  maxSelectableHourForDate,
  selectableHoursForDate,
} from "@/lib/bible/history-hours";
import { getSlotForHour, themeLabel, type HourlyThemeId } from "@/lib/bible/hourly-themes";
import { resolveHourlyVerseClient } from "@/lib/bible/resolve-hourly-verse.client";

interface HourlyVersePayload {
  hour: number;
  theme: HourlyThemeId;
  themeLabel: string;
  scheduledRef: string;
  poolSize: number;
  passage: { ref: string; text: string; refEn?: string } | null;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatDisplayDate(dateStr: string, locale: "en" | "sw"): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const loc = locale === "sw" ? "sw-KE" : "en-US";
  return new Intl.DateTimeFormat(loc, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function VerseHistoryView() {
  const { locale, t } = useLocale();
  const [now, setNow] = useState<Date | null>(null);
  const [date, setDate] = useState("");
  const [hour, setHour] = useState(0);
  const [verse, setVerse] = useState<HourlyVersePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const today = now ? localDateInputValue(now) : "";
  const isFutureDate = Boolean(date && today && date > today);

  useEffect(() => {
    const current = new Date();
    setNow(current);
    setDate(localDateInputValue(current));
    setHour(current.getHours());

    const params = new URLSearchParams(window.location.search);
    const h = params.get("hour");
    if (h !== null) {
      const parsed = Number(h);
      if (parsed >= 0 && parsed <= 23) {
        setHour(clampHourForDate(localDateInputValue(current), parsed, current));
      }
    }

    const tick = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!date || !now || isFutureDate) {
      setVerse(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const slot = getSlotForHour(hour);
        const resolved = await resolveHourlyVerseClient(
          slot.theme,
          locale,
          hour,
          date,
        );
        if (cancelled) return;

        if (resolved.passage) {
          setVerse({
            hour,
            theme: slot.theme,
            themeLabel: themeLabel(slot.theme, locale),
            scheduledRef: resolved.scheduledRef,
            poolSize: resolved.poolSize,
            passage: resolved.passage,
          });
          return;
        }

        const res = await fetch(
          `/api/hourly-verse?locale=${locale}&hour=${hour}&date=${date}`,
        );
        const data = (await res.json()) as HourlyVersePayload;
        if (!cancelled) setVerse(data);
      } catch {
        if (!cancelled) setVerse(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [date, hour, locale, now, isFutureDate]);

  const allowedHours = useMemo(() => {
    if (!date || !now) return [];
    return selectableHoursForDate(date, now);
  }, [date, now]);

  const maxHour = useMemo(() => {
    if (!date || !now) return 23;
    return maxSelectableHourForDate(date, now);
  }, [date, now]);

  useEffect(() => {
    if (!now || !date) return;
    setHour((prev) => clampHourForDate(date, prev, now));
  }, [date, now]);

  const handleDateChange = useCallback(
    (nextDate: string) => {
      if (!now) return;
      if (nextDate > localDateInputValue(now)) return;
      setDate(nextDate);
      setHour((prev) => clampHourForDate(nextDate, prev, now));
    },
    [now],
  );

  const copyVerse = useCallback(async () => {
    if (!verse?.passage) return;
    const label =
      verse.passage.refEn && verse.passage.refEn !== verse.passage.ref
        ? `${verse.passage.ref} (${verse.passage.refEn})`
        : verse.passage.ref;
    const header = `${formatDisplayDate(date, locale)} · ${pad(hour)}:00`;
    const text = `${header}\n${label}\n${verse.passage.text}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [date, hour, locale, verse]);

  return (
    <div className="canvas-gradient flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <AppHeader aiReady showNav compactNav hideStatusOnMobile />

      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
        <div className="shrink-0 text-center">
          <h1 className="font-heading text-lg font-semibold sm:text-xl">
            {t("historyTitle")}
          </h1>
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground sm:text-xs">
            {t("historySubtitle")}
          </p>
        </div>

        <div className="mt-2 grid shrink-0 grid-cols-2 gap-2">
          <label className="block min-w-0 text-left">
            <span className="text-[10px] font-medium text-muted-foreground">
              {t("historyDate")}
            </span>
            <input
              type="date"
              value={date}
              max={today || undefined}
              onChange={(e) => handleDateChange(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs sm:text-sm"
            />
          </label>
          <label className="block min-w-0 text-left">
            <span className="text-[10px] font-medium text-muted-foreground">
              {t("historyHour")}
            </span>
            <select
              value={allowedHours.includes(hour) ? hour : (allowedHours.at(-1) ?? 0)}
              onChange={(e) => setHour(Number(e.target.value))}
              disabled={isFutureDate || allowedHours.length === 0}
              className="mt-0.5 w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs disabled:opacity-50 sm:text-sm"
            >
              {allowedHours.map((h) => (
                <option key={h} value={h}>
                  {pad(h)}:00
                </option>
              ))}
            </select>
          </label>
        </div>

        {date === today && maxHour >= 0 && (
          <p className="mt-1.5 shrink-0 text-center text-[10px] text-muted-foreground">
            {t("historyTodayLimit", { hour: pad(maxHour) })}
          </p>
        )}

        <div className="mt-2 flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {isFutureDate ? (
              <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                {t("historyFutureDate")}
              </div>
            ) : loading && !verse ? (
              <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                {t("homeLoading")}
              </div>
            ) : verse?.passage ? (
              <div className="knowledge-card rounded-xl px-3.5 py-3.5 text-left sm:px-4 sm:py-4">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="truncate rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-light">
                    {verse.themeLabel}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void copyVerse()}
                    className="h-7 shrink-0 gap-1 px-1.5 text-[10px] text-muted-foreground"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-brand" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copied ? t("copied") : t("copy")}
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground sm:text-[11px]">
                  {formatDisplayDate(date, locale)} · {t("historyHourLabel", { hour })}
                </p>

                <p className="mt-1.5 font-heading text-base font-semibold leading-snug text-brand-light sm:text-lg">
                  {verse.passage.ref}
                  {verse.passage.refEn &&
                  verse.passage.refEn !== verse.passage.ref ? (
                    <span className="ml-1 block text-[10px] font-normal text-muted-foreground sm:inline sm:text-sm">
                      ({verse.passage.refEn})
                    </span>
                  ) : null}
                </p>

                <p className="mt-2 text-sm leading-relaxed text-foreground/95 sm:text-base">
                  {verse.passage.text}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                {t("homeVerseUnavailable")}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 shrink-0 flex justify-center gap-2 pt-1">
          <Link
            href="/home"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand/30 px-3 text-xs font-medium"
          >
            <Home className="h-3.5 w-3.5" />
            {t("navHome")}
          </Link>
          <Link
            href="/notifications"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 px-3 text-xs font-medium text-muted-foreground"
          >
            <Bell className="h-3.5 w-3.5" />
            {t("navAlerts")}
          </Link>
        </div>
      </main>
    </div>
  );
}
