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
import {
  enumerateHistoryRange,
  type HistorySlot,
} from "@/lib/bible/history-range";
import {
  resolveHistoryVerse,
  resolveHistoryVerseBatch,
  type HistoryVerseResult,
} from "@/lib/bible/resolve-history-verse";
import { cn } from "@/lib/utils";

type HistoryMode = "single" | "range";

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

function VerseCard({
  verse,
  locale,
  hourLabel,
  onCopy,
  copied,
  copyLabel,
  copiedLabel,
}: {
  verse: HistoryVerseResult;
  locale: "en" | "sw";
  hourLabel: (hour: number) => string;
  onCopy: () => void;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
}) {
  if (!verse.passage) return null;

  return (
    <div className="knowledge-card rounded-xl px-3.5 py-3.5 text-left sm:px-4 sm:py-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="truncate rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-light">
          {verse.themeLabel}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-7 shrink-0 gap-1 px-1.5 text-[10px] text-muted-foreground"
        >
          {copied ? (
            <Check className="h-3 w-3 text-brand" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground sm:text-[11px]">
        {formatDisplayDate(verse.date, locale)} · {hourLabel(verse.hour)}
      </p>

      <p className="mt-1.5 font-heading text-base font-semibold leading-snug text-brand-light sm:text-lg">
        {verse.passage.ref}
        {verse.passage.refEn && verse.passage.refEn !== verse.passage.ref ? (
          <span className="ml-1 block text-[10px] font-normal text-muted-foreground sm:inline sm:text-sm">
            ({verse.passage.refEn})
          </span>
        ) : null}
      </p>

      <p className="mt-2 text-sm leading-relaxed text-foreground/95 sm:text-base">
        {verse.passage.text}
      </p>
    </div>
  );
}

export function VerseHistoryView() {
  const { locale, t } = useLocale();
  const [now, setNow] = useState<Date | null>(null);
  const [mode, setMode] = useState<HistoryMode>("single");

  const [date, setDate] = useState("");
  const [hour, setHour] = useState(0);

  const [fromDate, setFromDate] = useState("");
  const [fromHour, setFromHour] = useState(0);
  const [toDate, setToDate] = useState("");
  const [toHour, setToHour] = useState(0);
  const [rangeApplied, setRangeApplied] = useState(false);

  const [verse, setVerse] = useState<HistoryVerseResult | null>(null);
  const [rangeVerses, setRangeVerses] = useState<HistoryVerseResult[]>([]);
  const [rangeMeta, setRangeMeta] = useState<{
    truncated: boolean;
    totalMatched: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const today = now ? localDateInputValue(now) : "";

  const hourLabel = useCallback(
    (h: number) => t("historyHourLabel", { hour: pad(h) }),
    [t],
  );

  useEffect(() => {
    const current = new Date();
    setNow(current);
    const todayStr = localDateInputValue(current);
    const currentHour = current.getHours();

    setDate(todayStr);
    setHour(currentHour);
    setFromDate(todayStr);
    setFromHour(0);
    setToDate(todayStr);
    setToHour(currentHour);

    const params = new URLSearchParams(window.location.search);
    const h = params.get("hour");
    if (h !== null) {
      const parsed = Number(h);
      if (parsed >= 0 && parsed <= 23) {
        setHour(clampHourForDate(todayStr, parsed, current));
        setToHour(clampHourForDate(todayStr, parsed, current));
      }
    }

    const tick = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  const isFutureDate = Boolean(date && today && date > today);
  const isFutureFrom = Boolean(fromDate && today && fromDate > today);
  const isFutureTo = Boolean(toDate && today && toDate > today);

  const allowedHours = useMemo(() => {
    if (!date || !now) return [];
    return selectableHoursForDate(date, now);
  }, [date, now]);

  const allowedFromHours = useMemo(() => {
    if (!fromDate || !now) return [];
    return selectableHoursForDate(fromDate, now);
  }, [fromDate, now]);

  const allowedToHours = useMemo(() => {
    if (!toDate || !now) return [];
    return selectableHoursForDate(toDate, now);
  }, [toDate, now]);

  const maxHour = useMemo(() => {
    if (!date || !now) return 23;
    return maxSelectableHourForDate(date, now);
  }, [date, now]);

  useEffect(() => {
    if (!now || !date) return;
    setHour((prev) => clampHourForDate(date, prev, now));
  }, [date, now]);

  useEffect(() => {
    if (!now || !fromDate) return;
    setFromHour((prev) => clampHourForDate(fromDate, prev, now));
  }, [fromDate, now]);

  useEffect(() => {
    if (!now || !toDate) return;
    setToHour((prev) => clampHourForDate(toDate, prev, now));
  }, [toDate, now]);

  useEffect(() => {
    if (mode !== "single" || !date || !now || isFutureDate) {
      if (mode === "single") {
        setVerse(null);
        setLoading(false);
      }
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      const result = await resolveHistoryVerse(date, hour, locale);
      if (!cancelled) {
        setVerse(result);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, date, hour, locale, now, isFutureDate]);

  const runRangeLookup = useCallback(async () => {
    if (!now || isFutureFrom || isFutureTo) return;

    const from: HistorySlot = { date: fromDate, hour: fromHour };
    const to: HistorySlot = { date: toDate, hour: toHour };
    const { slots, truncated, totalMatched } = enumerateHistoryRange(
      from,
      to,
      now,
    );

    setRangeApplied(true);
    setLoading(true);
    setRangeMeta({ truncated, totalMatched });

    if (slots.length === 0) {
      setRangeVerses([]);
      setLoading(false);
      return;
    }

    const results = await resolveHistoryVerseBatch(slots, locale);
    setRangeVerses(results);
    setLoading(false);
  }, [
    now,
    fromDate,
    fromHour,
    toDate,
    toHour,
    locale,
    isFutureFrom,
    isFutureTo,
  ]);

  const handleDateChange = useCallback(
    (nextDate: string) => {
      if (!now) return;
      if (nextDate > localDateInputValue(now)) return;
      setDate(nextDate);
    },
    [now],
  );

  const copyVerse = useCallback(
    async (item: HistoryVerseResult) => {
      if (!item.passage) return;
      const label =
        item.passage.refEn && item.passage.refEn !== item.passage.ref
          ? `${item.passage.ref} (${item.passage.refEn})`
          : item.passage.ref;
      const header = `${formatDisplayDate(item.date, locale)} · ${pad(item.hour)}:00`;
      const text = `${header}\n${label}\n${item.passage.text}`;
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(`${item.date}-${item.hour}`);
        window.setTimeout(() => setCopiedId(null), 2000);
      } catch {
        /* clipboard unavailable */
      }
    },
    [locale],
  );

  const copyAll = useCallback(async () => {
    if (rangeVerses.length === 0) return;

    const body = rangeVerses
      .filter((v) => v.passage)
      .map((item) => {
        const label =
          item.passage!.refEn && item.passage!.refEn !== item.passage!.ref
            ? `${item.passage!.ref} (${item.passage!.refEn})`
            : item.passage!.ref;
        const header = `${formatDisplayDate(item.date, locale)} · ${pad(item.hour)}:00`;
        return `${header}\n${label}\n${item.passage!.text}`;
      })
      .join("\n\n---\n\n");

    try {
      await navigator.clipboard.writeText(body);
      setCopiedAll(true);
      window.setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [locale, rangeVerses]);

  const rangeInvalid = isFutureFrom || isFutureTo;
  const showRangeResults = mode === "range" && rangeApplied;

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

        <div
          className="mt-2 flex shrink-0 rounded-lg border border-border/60 bg-muted/40 p-0.5"
          role="tablist"
          aria-label="History mode"
        >
          {(["single", "range"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => {
                setMode(value);
                if (value === "range") setRangeApplied(false);
              }}
              className={cn(
                "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                mode === value
                  ? "bg-brand text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "single" ? t("historyModeSingle") : t("historyModeRange")}
            </button>
          ))}
        </div>

        {mode === "single" ? (
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
                value={
                  allowedHours.includes(hour) ? hour : (allowedHours.at(-1) ?? 0)
                }
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
        ) : (
          <div className="mt-2 shrink-0 space-y-2">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">
                {t("historyFrom")}
              </p>
              <div className="mt-0.5 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fromDate}
                  max={today || undefined}
                  onChange={(e) => {
                    if (!now || e.target.value > localDateInputValue(now)) return;
                    setFromDate(e.target.value);
                  }}
                  className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs sm:text-sm"
                />
                <select
                  value={
                    allowedFromHours.includes(fromHour)
                      ? fromHour
                      : (allowedFromHours.at(-1) ?? 0)
                  }
                  onChange={(e) => setFromHour(Number(e.target.value))}
                  disabled={isFutureFrom || allowedFromHours.length === 0}
                  className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs disabled:opacity-50 sm:text-sm"
                >
                  {allowedFromHours.map((h) => (
                    <option key={h} value={h}>
                      {pad(h)}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-medium text-muted-foreground">
                {t("historyTo")}
              </p>
              <div className="mt-0.5 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={toDate}
                  max={today || undefined}
                  onChange={(e) => {
                    if (!now || e.target.value > localDateInputValue(now)) return;
                    setToDate(e.target.value);
                  }}
                  className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs sm:text-sm"
                />
                <select
                  value={
                    allowedToHours.includes(toHour)
                      ? toHour
                      : (allowedToHours.at(-1) ?? 0)
                  }
                  onChange={(e) => setToHour(Number(e.target.value))}
                  disabled={isFutureTo || allowedToHours.length === 0}
                  className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs disabled:opacity-50 sm:text-sm"
                >
                  {allowedToHours.map((h) => (
                    <option key={h} value={h}>
                      {pad(h)}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              disabled={rangeInvalid || loading}
              onClick={() => void runRangeLookup()}
              className="h-8 w-full text-xs sm:text-sm"
            >
              {t("historyLookUp")}
            </Button>
          </div>
        )}

        {mode === "single" && date === today && maxHour >= 0 && (
          <p className="mt-1.5 shrink-0 text-center text-[10px] text-muted-foreground">
            {t("historyTodayLimit", { hour: pad(maxHour) })}
          </p>
        )}

        {showRangeResults && rangeMeta && rangeMeta.totalMatched > 0 && (
          <div className="mt-1.5 flex shrink-0 items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">
              {t("historyRangeCount", { count: rangeMeta.totalMatched })}
            </p>
            {rangeVerses.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void copyAll()}
                className="h-7 gap-1 px-2 text-[10px] text-muted-foreground"
              >
                {copiedAll ? (
                  <Check className="h-3 w-3 text-brand" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copiedAll ? t("historyCopiedAll") : t("historyCopyAll")}
              </Button>
            )}
          </div>
        )}

        {showRangeResults && rangeMeta?.truncated && (
          <p className="mt-1 shrink-0 text-center text-[10px] text-amber-400/90">
            {t("historyRangeTruncated", {
              shown: rangeVerses.length,
              total: rangeMeta.totalMatched,
            })}
          </p>
        )}

        <div className="mt-2 flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-1">
            {mode === "single" && isFutureDate ? (
              <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                {t("historyFutureDate")}
              </div>
            ) : mode === "range" && rangeInvalid ? (
              <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                {t("historyFutureDate")}
              </div>
            ) : loading && (mode === "single" ? !verse : rangeVerses.length === 0) ? (
              <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                {t("homeLoading")}
              </div>
            ) : mode === "single" && verse?.passage ? (
              <VerseCard
                verse={verse}
                locale={locale}
                hourLabel={hourLabel}
                onCopy={() => void copyVerse(verse)}
                copied={copiedId === `${verse.date}-${verse.hour}`}
                copyLabel={t("copy")}
                copiedLabel={t("copied")}
              />
            ) : showRangeResults && rangeVerses.length > 0 ? (
              rangeVerses.map((item) => (
                <VerseCard
                  key={`${item.date}-${item.hour}`}
                  verse={item}
                  locale={locale}
                  hourLabel={hourLabel}
                  onCopy={() => void copyVerse(item)}
                  copied={copiedId === `${item.date}-${item.hour}`}
                  copyLabel={t("copy")}
                  copiedLabel={t("copied")}
                />
              ))
            ) : showRangeResults && rangeApplied ? (
              <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                {t("historyRangeEmpty")}
              </div>
            ) : mode === "single" ? (
              <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                {t("homeVerseUnavailable")}
              </div>
            ) : null}
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
