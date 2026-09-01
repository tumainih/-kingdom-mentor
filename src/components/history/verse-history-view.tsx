"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Check, Copy, Search } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { VerseNotificationsToggle } from "@/components/pwa/verse-notifications-toggle";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import type { HourlyThemeId } from "@/lib/bible/hourly-themes";
import {
  DEFAULT_NOTIFY_HOURS,
  getNotifyHours,
  isVerseNotificationsEnabled,
  setNotifyHours,
  syncVerseNotifications,
} from "@/lib/notifications/verse-notifications";

interface HourlyVersePayload {
  hour: number;
  theme: HourlyThemeId;
  themeLabel: string;
  scheduledRef: string;
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
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function localDateInputValue(date = new Date()): string {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

export function VerseHistoryView() {
  const { locale, t } = useLocale();
  const [date, setDate] = useState("");
  const [hour, setHour] = useState(0);
  const [slots, setSlots] = useState<HourlyVersePayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedHours, setSelectedHours] = useState<number[]>(DEFAULT_NOTIFY_HOURS);

  useEffect(() => {
    setDate(localDateInputValue());
    setHour(new Date().getHours());
    setSelectedHours(getNotifyHours());

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const h = params.get("hour");
      if (h !== null) {
        const parsed = Number(h);
        if (parsed >= 0 && parsed <= 23) setHour(parsed);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/data/hourly-${locale}.json`);
        const data = (await res.json()) as HourlyVersePayload[];
        if (!cancelled) setSlots(data);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const verse = useMemo(
    () => slots.find((s) => s.hour === hour) ?? null,
    [slots, hour],
  );

  useEffect(() => {
    if (!isVerseNotificationsEnabled()) return;
    void syncVerseNotifications(locale);
  }, [selectedHours, locale]);

  const toggleNotifyHour = useCallback((h: number) => {
    setSelectedHours((prev) => {
      const next = prev.includes(h)
        ? prev.filter((x) => x !== h)
        : [...prev, h].sort((a, b) => a - b);
      setNotifyHours(next);
      return next;
    });
  }, []);

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

      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-y-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:pt-3">
        <div className="shrink-0 text-center">
          <Calendar className="mx-auto h-8 w-8 text-brand" />
          <h1 className="mt-2 font-heading text-xl font-semibold sm:text-2xl">
            {t("historyTitle")}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {t("historySubtitle")}
          </p>
        </div>

        <div className="mt-4 grid shrink-0 gap-3 sm:grid-cols-2">
          <label className="block text-left">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("historyDate")}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-left">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("historyHour")}
            </span>
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {pad(h)}:00
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          {loading ? (
            <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
              {t("homeLoading")}
            </div>
          ) : verse?.passage ? (
            <div className="knowledge-card rounded-xl px-4 py-4 text-left sm:px-5 sm:py-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-light">
                  {verse.themeLabel}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void copyVerse()}
                  className="h-7 gap-1 px-1.5 text-[10px] text-muted-foreground"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-brand" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? t("copied") : t("copy")}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {formatDisplayDate(date, locale)} · {t("historyHourLabel", { hour })}
              </p>

              <p className="mt-2 font-heading text-base font-semibold text-brand-light sm:text-lg">
                {verse.passage.ref}
                {verse.passage.refEn &&
                verse.passage.refEn !== verse.passage.ref ? (
                  <span className="ml-1 block text-[11px] font-normal text-muted-foreground sm:inline sm:text-sm">
                    ({verse.passage.refEn})
                  </span>
                ) : null}
              </p>

              <p className="mt-2.5 text-sm leading-relaxed text-foreground/95 sm:text-base">
                {verse.passage.text}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
              {t("homeVerseUnavailable")}
            </div>
          )}
        </div>

        <div className="mt-4 shrink-0 rounded-xl border border-border/50 bg-card/50 p-3 sm:p-4">
          <p className="text-left text-xs font-semibold text-foreground">
            {t("historyNotifyHoursTitle")}
          </p>
          <p className="mt-1 text-left text-[11px] text-muted-foreground">
            {t("historyNotifyHoursHint")}
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {Array.from({ length: 24 }, (_, h) => {
              const active = selectedHours.includes(h);
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => toggleNotifyHour(h)}
                  className={`rounded-md border px-1 py-1.5 text-[10px] font-semibold sm:text-xs ${
                    active
                      ? "border-brand bg-brand/15 text-brand-light"
                      : "border-border/50 text-muted-foreground"
                  }`}
                >
                  {pad(h)}:00
                </button>
              );
            })}
          </div>
          <VerseNotificationsToggle compact />
        </div>

        <div className="mt-3 shrink-0 pb-1 text-center">
          <Link
            href="/home"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand/30 px-3 text-xs font-medium"
          >
            <Search className="h-3.5 w-3.5" />
            {t("historyBackHome")}
          </Link>
        </div>
      </main>
    </div>
  );
}
