"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3 } from "lucide-react";
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
import { formatLapse } from "@/lib/reading/rates";
import { subscribeReadingUpdates } from "@/lib/reading/reading-sync.client";
import { reportUnitLabel } from "@/lib/reading/periods";
import type { ScaleCell } from "@/lib/reading/report-hierarchy";
import type { DevelopmentReport } from "@/lib/reading/types";
import {
  cellToReport,
  ReportHierarchyView,
} from "@/components/reports/report-hierarchy-view";

function formatDate(ts: number, locale: string) {
  return new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ts));
}

export function DevelopmentReportView() {
  const { locale, t } = useLocale();
  const searchParams = useSearchParams();
  const pendingReportId = searchParams.get("report");

  const [events, setEvents] = useState<Awaited<ReturnType<typeof loadReadingData>>["events"]>([]);
  const [reports, setReports] = useState<DevelopmentReport[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<DevelopmentReport | null>(null);
  const [activeCell, setActiveCell] = useState<ScaleCell | null>(null);
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
    const unsubscribe = subscribeReadingUpdates(() => {
      void refreshReadingData(deviceId, timezone, locale).then((data) => {
        setEvents(data.events);
        setReports(data.reports);
        setStartedAt(data.meta?.startedAt ?? null);
      });
    });
    return unsubscribe;
  }, [deviceId, locale, timezone]);

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

  const handleSelectCell = useCallback(
    (cell: ScaleCell, report?: DevelopmentReport) => {
      setActiveCell(cell);
      if (report) {
        setActiveReport(report);
        setNote(report.note ?? "");
      } else {
        setActiveReport(null);
        setNote("");
      }
    },
    [],
  );

  const submitNote = useCallback(async () => {
    if (!activeReport) return;
    setSubmitting(true);
    try {
      const ok = await saveReportNoteClient(deviceId, activeReport.id, note);
      if (ok) {
        setActiveReport(null);
        setActiveCell(null);
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  }, [activeReport, deviceId, load, note]);

  const detailReport = activeReport ?? (activeCell ? cellToReport(reports, activeCell) : undefined);

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
        ) : reports.length === 0 && events.length === 0 ? (
          <p className="mt-4 rounded-lg border border-border/50 bg-card/40 p-4 text-center text-xs text-muted-foreground">
            {t("reportEmpty")}
          </p>
        ) : (
          <div className="mt-3">
            <ReportHierarchyView
              events={events}
              reports={reports}
              startedAt={startedAt}
              timezone={timezone}
              onSelectCell={handleSelectCell}
            />
          </div>
        )}

        <details className="mt-4 rounded-xl border border-border/50 bg-card/40 p-3">
          <summary className="cursor-pointer text-xs font-semibold">{t("reportCustomTitle")}</summary>
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
        </details>
      </main>

      {(activeCell || detailReport) ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-border/60 bg-background p-4 shadow-xl">
            {activeCell ? (
              <>
                <div
                  className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-border/40 px-3 py-2"
                  style={{ backgroundColor: activeCell.color }}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{activeCell.label}</p>
                    <p className="text-[10px] text-foreground/80">
                      {formatDate(activeCell.start, locale)} — {formatDate(activeCell.end, locale)}
                    </p>
                  </div>
                  <span className="rounded-md bg-black/20 px-2 py-1 text-sm font-bold text-foreground">
                    {activeCell.avgRate}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t("reportLapseAvg")}:{" "}
                  {activeCell.avgRate <= 0
                    ? t("reportUnread")
                    : formatLapse(
                        events
                          .filter(
                            (e) =>
                              !e.missed &&
                              e.shownAt >= activeCell.start &&
                              e.shownAt < activeCell.end,
                          )
                          .reduce((sum, e) => sum + e.lapseMs, 0) /
                          Math.max(
                            1,
                            events.filter(
                              (e) =>
                                !e.missed &&
                                e.shownAt >= activeCell.start &&
                                e.shownAt < activeCell.end,
                            ).length,
                          ),
                      )}{" "}
                  · {t("reportScaleAvg")}: {activeCell.avgRate} · {t("reportEvents")}:{" "}
                  {activeCell.eventCount}
                </p>
              </>
            ) : null}

            {detailReport ? (
              <>
                <p className="mt-2 font-heading text-sm font-semibold">
                  {detailReport.unit === "custom"
                    ? t("reportCustomTitle")
                    : reportUnitLabel(detailReport.unit, locale)}
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
                    onClick={() => {
                      setActiveReport(null);
                      setActiveCell(null);
                    }}
                  >
                    {t("reportClose")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={submitting || !detailReport}
                    onClick={() => void submitNote()}
                  >
                    {submitting ? t("notifyWorking") : t("reportSubmit")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setActiveCell(null)}
                >
                  {t("reportClose")}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
