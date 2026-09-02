"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, CalendarDays, FileText } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/context/locale-context";
import {
  getDeviceTimezone,
  getOrCreateDeviceId,
} from "@/lib/reading/device-id.client";
import { getNotifyHours } from "@/lib/notifications/verse-notifications";
import {
  generateCustomReportClient,
  loadReadingData,
  refreshReadingData,
  saveReportNoteClient,
} from "@/lib/reading/data.client";
import { formatLapse, rateToColor, UNREAD_COLOR } from "@/lib/reading/rates";
import { localDateKey } from "@/lib/reading/slots";
import { reportUnitLabel } from "@/lib/reading/periods";
import type { DevelopmentReport, ReadEvent } from "@/lib/reading/types";

function formatDate(ts: number, locale: string) {
  return new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ts));
}

function dayKey(ts: number, tz: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ts));
}

export function DevelopmentReportView() {
  const { locale, t } = useLocale();
  const searchParams = useSearchParams();
  const pendingReportId = searchParams.get("report");

  const [events, setEvents] = useState<ReadEvent[]>([]);
  const [reports, setReports] = useState<DevelopmentReport[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<DevelopmentReport | null>(null);
  const [note, setNote] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState<"ok" | "empty" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const timezone = useMemo(() => getDeviceTimezone(), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadReadingData(deviceId, timezone, locale, getNotifyHours());
      setEvents(data.events);
      setReports(data.reports);
      setStartedAt(data.meta?.startedAt ?? null);
    } finally {
      setLoading(false);
    }

    void refreshReadingData(deviceId, timezone, locale)
      .then((data) => {
        setEvents(data.events);
        setReports(data.reports);
        setStartedAt(data.meta?.startedAt ?? null);
      })
      .catch(() => {
        /* background refresh is best-effort */
      });
  }, [deviceId, locale, timezone]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!pendingReportId || !reports.length) return;
    const hit = reports.find((r) => r.id === pendingReportId);
    if (hit) {
      setActiveReport(hit);
      setNote(hit.note ?? "");
    }
  }, [pendingReportId, reports]);

  useEffect(() => {
    if (startedAt) {
      const toLocal = (ts: number) => {
        const d = new Date(ts);
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      setCustomFrom(toLocal(startedAt));
      setCustomTo(toLocal(Date.now()));
    }
  }, [startedAt]);

  const generateCustom = useCallback(async () => {
    if (!customFrom || !customTo) return;
    setGenerating(true);
    setGenMessage(null);
    try {
      const report = await generateCustomReportClient(
        deviceId,
        new Date(customFrom).getTime(),
        new Date(customTo).getTime(),
        timezone,
        locale,
      );
      if (report) {
        setGenMessage("ok");
        await load();
      } else {
        setGenMessage("empty");
      }
    } finally {
      setGenerating(false);
    }
  }, [customFrom, customTo, deviceId, locale, load, timezone]);

  const calendarDays = useMemo(() => {
    const map = new Map<string, { totalRate: number; count: number; color: string }>();
    for (const e of events) {
      const key = dayKey(e.shownAt, timezone);
      const prev = map.get(key) ?? { totalRate: 0, count: 0, color: UNREAD_COLOR };
      prev.totalRate += e.rate;
      prev.count += 1;
      const avg = prev.totalRate / prev.count;
      map.set(key, { ...prev, color: rateToColor(Math.round(avg)) });
    }

    if (startedAt) {
      let probe = startedAt;
      const end = Date.now();
      let guard = 0;
      while (probe <= end && guard++ < 4000) {
        const key = localDateKey(probe, timezone);
        if (!map.has(key)) {
          map.set(key, { totalRate: 0, count: 1, color: UNREAD_COLOR });
        }
        probe += 86_400_000;
      }
    }

    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [events, startedAt, timezone]);

  const submitNote = useCallback(async () => {
    if (!activeReport) return;
    setSubmitting(true);
    try {
      const ok = await saveReportNoteClient(deviceId, activeReport.id, note);
      if (ok) {
        setActiveReport(null);
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  }, [activeReport, deviceId, load, note]);

  return (
    <div className="canvas-gradient flex h-dvh min-h-0 flex-col overflow-hidden">
      <AppHeader aiReady showNav compactNav hideStatusOnMobile />

      <main className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-y-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
        <div className="shrink-0 text-center">
          <BarChart3 className="mx-auto h-7 w-7 text-brand sm:h-8 sm:w-8" />
          <h1 className="mt-1.5 font-heading text-lg font-semibold sm:text-xl">
            {t("reportPageTitle")}
          </h1>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">
            {t("reportPageSubtitle")}
          </p>
          {startedAt ? (
            <p className="mt-1 text-[10px] text-brand-light">
              {t("reportSince")} {formatDate(startedAt, locale)}
            </p>
          ) : null}
          <p className="mt-1 text-[10px] text-muted-foreground">{t("reportRateHint")}</p>
        </div>

        {loading ? (
          <p className="mt-6 text-center text-xs text-muted-foreground">{t("notifyWorking")}</p>
        ) : (
          <>
            <section className="mt-4 rounded-xl border border-border/50 bg-card/40 p-3">
              <p className="text-xs font-semibold">{t("reportCustomTitle")}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="text-[10px] text-muted-foreground">
                  {t("reportFrom")}
                  <input
                    type="datetime-local"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border/50 bg-background px-2 py-1.5 text-xs"
                  />
                </label>
                <label className="text-[10px] text-muted-foreground">
                  {t("reportTo")}
                  <input
                    type="datetime-local"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border/50 bg-background px-2 py-1.5 text-xs"
                  />
                </label>
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-2 w-full text-xs"
                disabled={generating || !customFrom || !customTo}
                onClick={() => void generateCustom()}
              >
                {generating ? t("notifyWorking") : t("reportGenerate")}
              </Button>
              {genMessage === "ok" ? (
                <p className="mt-2 text-[10px] text-brand-light">{t("reportGenerated")}</p>
              ) : genMessage === "empty" ? (
                <p className="mt-2 text-[10px] text-amber-200/90">{t("reportNoActivity")}</p>
              ) : null}
            </section>

            {reports.length === 0 && events.length === 0 ? (
              <p className="mt-4 rounded-lg border border-border/50 bg-card/40 p-4 text-center text-xs text-muted-foreground">
                {t("reportEmpty")}
              </p>
            ) : (
              <>
            <section className="mt-4 rounded-xl border border-border/50 bg-card/40 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold">
                <CalendarDays className="h-3.5 w-3.5 text-brand" />
                {t("reportCalendar")}
              </p>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {calendarDays.map(([date, cell]) => (
                  <div
                    key={date}
                    title={`${date} · ${cell.count} · avg ${(cell.totalRate / cell.count).toFixed(1)}`}
                    className="aspect-square rounded-md border border-border/30 text-[8px] font-medium text-foreground/80 flex items-end justify-center pb-0.5"
                    style={{ backgroundColor: cell.color }}
                  >
                    {date.slice(-2)}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-3 space-y-2">
              <p className="flex items-center gap-2 text-xs font-semibold">
                <FileText className="h-3.5 w-3.5 text-brand" />
                {t("reportTrend")}
              </p>
              {reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => {
                    setActiveReport(report);
                    setNote(report.note ?? "");
                  }}
                  className="w-full rounded-lg border border-border/50 bg-card/50 p-3 text-left transition-colors hover:border-brand/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {report.unit === "custom"
                          ? t("reportCustomTitle")
                          : reportUnitLabel(report.unit, locale)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatDate(report.periodStart, locale)} — {formatDate(report.periodEnd, locale)}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-md px-2 py-1 text-[10px] font-bold text-foreground"
                      style={{
                        backgroundColor:
                          report.avgRate <= 0 ? UNREAD_COLOR : report.color,
                      }}
                    >
                      {report.avgRate}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                    <span>
                      {t("reportLapseAvg")}:{" "}
                      {report.avgRate <= 0 ? t("reportUnread") : formatLapse(report.avgLapseMs)}
                    </span>
                    <span>
                      {t("reportEvents")}: {report.eventCount}
                    </span>
                    {report.note ? (
                      <span className="text-brand-light">{t("reportWhatHappened")}: ✓</span>
                    ) : null}
                  </div>
                </button>
              ))}
            </section>
              </>
            )}
          </>
        )}
      </main>

      {activeReport ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-border/60 bg-background p-4 shadow-xl">
            <p className="font-heading text-sm font-semibold">
              {reportUnitLabel(activeReport.unit, locale)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("reportLapseAvg")}:{" "}
              {activeReport.avgRate <= 0
                ? t("reportUnread")
                : formatLapse(activeReport.avgLapseMs)}{" "}
              · {t("reportScaleAvg")}: {activeReport.avgRate}
            </p>
            <label className="mt-3 block text-[11px] font-medium">{t("reportWhatHappened")}</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("reportNotePlaceholder")}
              className="mt-1 min-h-[88px] text-xs"
            />
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setActiveReport(null)}
              >
                {t("reportClose")}
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 text-xs"
                disabled={submitting}
                onClick={() => void submitNote()}
              >
                {submitting ? t("notifyWorking") : t("reportSubmit")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
